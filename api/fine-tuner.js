const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase;
if (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder')) {
    supabase = createClient(supabaseUrl, supabaseKey);
} else {
    console.log('⚠️  Supabase not configured - fine-tuning will be limited');
    supabase = null;
}

async function getContentForFineTuning() {
  try {
    const { data, error } = await supabase
      .from('content_sources')
      .select('*')
      .order('extracted_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching content for fine-tuning:', error);
    throw error;
  }
}

function prepareTrainingData(contentData) {
  const trainingData = [];
  
  contentData.forEach(item => {
    if (item.content) {
      // Clean the content - remove tabs and limit length
      const cleanContent = item.content
        .replace(/\t/g, ' ')  // Replace tabs with spaces
        .replace(/\n+/g, '\n')  // Normalize line breaks
        .trim();
      
      // Create shorter, more focused training examples
      const shortContent = cleanContent.substring(0, 800); // Limit to 800 chars
      
      // Example 1: Financial Analysis
      trainingData.push({
        messages: [
          { role: "system", content: "You are a helpful financial assistant with expertise in personal finance and investment analysis." },
          { role: "user", content: `What are the key financial insights from ${item.title}?` },
          { role: "assistant", content: `Based on ${item.title}, the key financial insights include: ${shortContent.substring(0, 400)}` }
        ]
      });

      // Example 2: Asset Summary
      trainingData.push({
        messages: [
          { role: "system", content: "You are a helpful assistant that provides clear financial summaries." },
          { role: "user", content: `Summarize the main financial information in ${item.title}` },
          { role: "assistant", content: `The main financial information in ${item.title} shows: ${shortContent.substring(0, 300)}` }
        ]
      });

      // Example 3: Specific Financial Questions
      trainingData.push({
        messages: [
          { role: "system", content: "You are a helpful assistant with access to detailed financial information." },
          { role: "user", content: `What are the main financial categories in ${item.title}?` },
          { role: "assistant", content: `The main financial categories in ${item.title} include: ${shortContent.substring(0, 350)}` }
        ]
      });
    }
  });

  return trainingData;
}

// Validate training data before creating file
function validateTrainingData(trainingData) {
  const issues = [];
  
  trainingData.forEach((example, index) => {
    // Check required fields
    if (!example.messages || !Array.isArray(example.messages)) {
      issues.push(`Example ${index}: Missing or invalid messages array`);
      return;
    }
    
    // Check message structure
    example.messages.forEach((message, msgIndex) => {
      if (!message.role || !message.content) {
        issues.push(`Example ${index}, message ${msgIndex}: Missing role or content`);
      }
      
      if (message.content.length > 4000) {
        issues.push(`Example ${index}, message ${msgIndex}: Content too long (${message.content.length} chars)`);
      }
    });
    
    // Check for at least one user and one assistant message
    const roles = example.messages.map(m => m.role);
    if (!roles.includes('user') || !roles.includes('assistant')) {
      issues.push(`Example ${index}: Missing user or assistant message`);
    }
  });
  
  if (issues.length > 0) {
    console.warn('Training data validation issues:', issues);
  }
  
  return issues.length === 0;
}

async function createTrainingFile(trainingData) {
  try {
    const fileName = `training_data_${Date.now()}.jsonl`;
    const filePath = path.join(__dirname, '..', 'temp', fileName);
    
    // Ensure temp directory exists
    const tempDir = path.dirname(filePath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Write training data to JSONL file synchronously to ensure it's written
    const fileContent = trainingData.map(example => JSON.stringify(example)).join('\n') + '\n';
    fs.writeFileSync(filePath, fileContent, 'utf8');
    
    // Verify file was created and has content
    if (!fs.existsSync(filePath)) {
      throw new Error(`Failed to create training file: ${filePath}`);
    }
    
    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      throw new Error(`Training file is empty: ${filePath}`);
    }
    
    console.log(`Training file created successfully: ${filePath} (${stats.size} bytes)`);
    return filePath;
  } catch (error) {
    console.error('Error creating training file:', error);
    throw error;
  }
}

async function uploadTrainingFile(filePath) {
  try {
    // Verify file exists before uploading
    if (!fs.existsSync(filePath)) {
      throw new Error(`Training file not found: ${filePath}`);
    }
    
    // Get file stats for debugging
    const stats = fs.statSync(filePath);
    console.log(`File exists: ${filePath} (${stats.size} bytes, modified: ${stats.mtime})`);
    
    // Verify file is readable
    try {
      const testRead = fs.readFileSync(filePath, 'utf8');
      console.log(`File is readable, first 100 chars: ${testRead.substring(0, 100)}...`);
    } catch (readError) {
      throw new Error(`File exists but cannot be read: ${readError.message}`);
    }
    
    console.log('Uploading training file to OpenAI:', filePath);
    const file = await openai.files.create({
      file: fs.createReadStream(filePath),
      purpose: 'fine-tune',
    });

    console.log('File uploaded successfully to OpenAI, ID:', file.id);
    return file.id;
  } catch (error) {
    console.error('Error uploading training file:', error);
    throw error;
  }
}

async function createFineTuneJob(fileId, modelName = 'gpt-3.5-turbo') {
  try {
    const fineTune = await openai.fineTuning.jobs.create({
      training_file: fileId,
      model: modelName,
      hyperparameters: {
        n_epochs: 3,
        batch_size: 1,
        learning_rate_multiplier: 1.0
      }
    });

    return fineTune;
  } catch (error) {
    console.error('Error creating fine-tune job:', error);
    throw error;
  }
}

async function saveFineTuneJob(jobData) {
  try {
    // Convert Unix timestamp to ISO string if needed
    let createdAt = jobData.created_at;
    if (typeof createdAt === 'number') {
      createdAt = new Date(createdAt * 1000).toISOString();
    } else if (typeof createdAt === 'string' && !isNaN(createdAt)) {
      createdAt = new Date(parseInt(createdAt) * 1000).toISOString();
    }
    
    console.log('Saving fine-tune job to database:', {
      job_id: jobData.id,
      status: jobData.status,
      model: jobData.model,
      created_at: createdAt
    });

    const { data, error } = await supabase
      .from('fine_tune_jobs')
      .insert([{
        job_id: jobData.id,
        status: jobData.status,
        model: jobData.model,
        training_file: jobData.training_file,
        created_at: createdAt,
        hyperparameters: jobData.hyperparameters
      }]);

    if (error) throw error;
    console.log('Fine-tune job saved to database successfully');
    return data;
  } catch (error) {
    console.error('Error saving fine-tune job:', error);
    throw error;
  }
}

async function startFineTuning() {
  try {
    console.log('Starting fine-tuning process...');
    
    // 1. Get content from database
    const contentData = await getContentForFineTuning();
    console.log(`Found ${contentData.length} content items`);

    if (contentData.length === 0) {
      throw new Error('No content found for fine-tuning');
    }

    // 2. Prepare training data
    const trainingData = prepareTrainingData(contentData);
    console.log(`Prepared ${trainingData.length} training examples`);

    // 2.5. Validate training data
    if (!validateTrainingData(trainingData)) {
      throw new Error('Training data validation failed. Check the logs for details.');
    }
    console.log('Training data validation passed');

    // 3. Create training file
    const filePath = await createTrainingFile(trainingData);
    console.log('Training file created:', filePath);

    // 3.5. Small delay to ensure file is fully written
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('Waiting 1 second to ensure file is fully written...');

    // 4. Upload file to OpenAI
    const fileId = await uploadTrainingFile(filePath);
    console.log('File uploaded to OpenAI:', fileId);

    // 5. Create fine-tune job
    const fineTuneJob = await createFineTuneJob(fileId);
    console.log('Fine-tune job created:', fineTuneJob.id);

    // 6. Save job to database
    await saveFineTuneJob(fineTuneJob);

    // 7. Keep the training file for now (OpenAI might need it)
    console.log('Training file kept for fine-tuning process:', filePath);

    return {
      success: true,
      jobId: fineTuneJob.id,
      status: fineTuneJob.status,
      trainingExamples: trainingData.length,
      filePath: filePath
    };

  } catch (error) {
    console.error('Fine-tuning failed:', error);
    throw error;
  }
}

async function getFineTuneStatus(jobId) {
  try {
    const job = await openai.fineTuning.jobs.retrieve(jobId);
    return job;
  } catch (error) {
    console.error('Error getting fine-tune status:', error);
    throw error;
  }
}

// Clean up old training files
async function cleanupOldTrainingFiles() {
  try {
    const tempDir = path.join(__dirname, '..', 'temp');
    if (!fs.existsSync(tempDir)) {
      return;
    }

    const files = fs.readdirSync(tempDir);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const file of files) {
      if (file.startsWith('training_data_') && file.endsWith('.jsonl')) {
        const filePath = path.join(tempDir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          console.log('Cleaned up old training file:', file);
        }
      }
    }
  } catch (error) {
    console.error('Error cleaning up training files:', error);
  }
}

module.exports = {
  startFineTuning,
  getFineTuneStatus,
  prepareTrainingData,
  cleanupOldTrainingFiles
};
