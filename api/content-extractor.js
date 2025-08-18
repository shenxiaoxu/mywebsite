const { google } = require('googleapis');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase;
if (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder')) {
    supabase = createClient(supabaseUrl, supabaseKey);
} else {
    console.log('⚠️  Supabase not configured - content extraction will be limited');
    supabase = null;
}

// Initialize Google APIs
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS || 'google-credentials.json',
  scopes: [
    'https://www.googleapis.com/auth/documents.readonly',
    'https://www.googleapis.com/auth/spreadsheets.readonly'
  ],
});

const docs = google.docs({ version: 'v1', auth });
const sheets = google.sheets({ version: 'v4', auth });

async function extractGoogleDocContent(docId) {
  try {
    const response = await docs.documents.get({
      documentId: docId,
    });

    const document = response.data;
    let content = '';

    // Extract text content from the document
    if (document.body && document.body.content) {
      document.body.content.forEach(element => {
        if (element.paragraph) {
          element.paragraph.elements.forEach(paraElement => {
            if (paraElement.textRun) {
              content += paraElement.textRun.content;
            }
          });
        }
      });
    }

    return {
      title: document.title,
      content: content.trim(),
      lastModified: document.modifiedTime,
      documentId: docId
    };
  } catch (error) {
    console.error('Error extracting Google Doc content:', error);
    throw error;
  }
}

async function extractGoogleSheetContent(sheetId) {
  try {
    // Get spreadsheet metadata
    const metadataResponse = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
      ranges: [],
      includeGridData: false
    });

    const spreadsheet = metadataResponse.data;
    const title = spreadsheet.properties.title;

    // Get all sheets in the spreadsheet
    const sheetsResponse = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: sheetId,
      ranges: spreadsheet.sheets.map(sheet => sheet.properties.title)
    });

    let content = '';
    const sheetData = [];

    // Process each sheet
    sheetsResponse.data.valueRanges.forEach((range, index) => {
      const sheetName = spreadsheet.sheets[index].properties.title;
      const values = range.values || [];
      
      if (values.length > 0) {
        content += `\n\n=== ${sheetName} ===\n\n`;
        
        // Convert sheet data to text
        values.forEach(row => {
          if (row && row.length > 0) {
            const rowText = row.map(cell => cell || '').join('\t');
            content += rowText + '\n';
          }
        });

        // Store structured data for potential future use
        sheetData.push({
          sheetName,
          data: values,
          rowCount: values.length,
          columnCount: values.length > 0 ? values[0].length : 0
        });
      }
    });

    return {
      title: title,
      content: content.trim(),
      lastModified: spreadsheet.properties.updated,
      documentId: sheetId,
      sheetData: sheetData,
      totalSheets: spreadsheet.sheets.length
    };
  } catch (error) {
    console.error('Error extracting Google Sheet content:', error);
    throw error;
  }
}

async function saveContentToDatabase(contentData, sourceType = 'google_doc') {
  try {
    const { data, error } = await supabase
      .from('content_sources')
      .insert([{
        source_type: sourceType,
        title: contentData.title,
        content: contentData.content,
        source_id: contentData.documentId,
        last_modified: contentData.lastModified,
        extracted_at: new Date().toISOString(),
        metadata: contentData.sheetData ? { sheetData: contentData.sheetData } : null
      }]);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving content to database:', error);
    throw error;
  }
}

// Helper function to detect content type from URL or ID
function detectContentType(input) {
  // Check if it's a URL
  if (input.includes('docs.google.com')) {
    if (input.includes('/spreadsheets/')) {
      return 'google_sheet';
    } else if (input.includes('/document/')) {
      return 'google_doc';
    }
  }
  
  // For IDs, we'll need to try both APIs or use a convention
  // You could prefix IDs like 'sheet:' or 'doc:' to distinguish
  if (input.startsWith('sheet:')) {
    return 'google_sheet';
  } else if (input.startsWith('doc:')) {
    return 'google_doc';
  }
  
  // Default to doc for backward compatibility
  return 'google_doc';
}

// Extract ID from URL or return as-is
function extractId(input) {
  if (input.includes('docs.google.com')) {
    // Extract ID from Google URL
    const match = input.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : input;
  }
  // Remove prefix if present
  return input.replace(/^(sheet:|doc:)/, '');
}

module.exports = {
  extractGoogleDocContent,
  extractGoogleSheetContent,
  saveContentToDatabase,
  detectContentType,
  extractId
};
