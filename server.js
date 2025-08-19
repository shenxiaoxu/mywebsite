const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Import new modules
const { extractGoogleDocContent, extractGoogleSheetContent, saveContentToDatabase, detectContentType, extractId } = require('./api/content-extractor');
const { startFineTuning, getFineTuneStatus } = require('./api/fine-tuner');
const { getDeployedModels, deployFineTunedModel, callFineTunedModel, switchActiveModel, getActiveModel } = require('./api/model-deployer');
const { evaluateModel, compareModels, runAutomatedEvaluation, getEvaluationHistory } = require('./api/model-evaluator');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase;
if (supabaseUrl && supabaseKey && !supabaseUrl.includes('placeholder')) {
    supabase = createClient(supabaseUrl, supabaseKey);
} else {
    console.log('⚠️  Supabase not configured - some features will be limited');
    supabase = null;
}

// Middleware
app.use(express.json());

// Serve static files with correct MIME types
app.use(express.static('.', {
  setHeaders: (res, path) => {
    if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Generate session ID middleware
app.use((req, res, next) => {
    if (!req.headers['x-session-id']) {
        req.sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    } else {
        req.sessionId = req.headers['x-session-id'];
    }
    next();
});

// Real ChatGPT API endpoint with Supabase storage
app.post('/api/chat', async (req, res) => {
    try {
        const { messages, model = 'gpt-4o', max_tokens = 1000, temperature = 0.7 } = req.body;
        const sessionId = req.sessionId;
        const userIp = req.ip || req.connection.remoteAddress;

        console.log('Processing chat request for session:', sessionId);

        // Check if environment variables are set
        if (!process.env.OPENAI_API_KEY) {
            return res.status(500).json({ error: 'OpenAI API key not configured' });
        }

        if (!supabaseUrl || !supabaseKey) {
            return res.status(500).json({ error: 'Supabase not configured' });
        }

        // Create or get session
        const { data: session, error: sessionError } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('session_id', sessionId)
            .single();

        if (sessionError && sessionError.code !== 'PGRST116') {
            throw sessionError;
        }

        if (!session) {
            await supabase
                .from('chat_sessions')
                .insert([{ session_id: sessionId, user_ip: userIp }]);
        }

        // Save user message to database
        const lastUserMessage = messages[messages.length - 1];
        if (lastUserMessage && lastUserMessage.role === 'user') {
            await supabase
                .from('chat_messages')
                .insert([{
                    session_id: sessionId,
                    role: 'user',
                    content: lastUserMessage.content
                }]);
        }

        // Call real OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model,
                messages,
                max_tokens,
                temperature
            })
        });

        if (!response.ok) {
            const error = await response.json();
            console.error('OpenAI API Error:', error);
            return res.status(response.status).json({
                error: 'Failed to get response from ChatGPT',
                details: error
            });
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        const tokensUsed = data.usage?.total_tokens;

        // Save AI response to database
        await supabase
            .from('chat_messages')
            .insert([{
                session_id: sessionId,
                role: 'assistant',
                content: aiResponse,
                tokens_used: tokensUsed,
                model_used: model
            }]);

        // Add session ID to response headers
        res.setHeader('X-Session-ID', sessionId);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Session-ID');

        console.log('Chat request completed successfully');
        res.json(data);

    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Get chat history for a session
app.get('/api/chat/history/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        console.log('Fetching chat history for session:', sessionId);
        
        const { data, error } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.json({ history: data || [] });
    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({ error: 'Failed to fetch chat history' });
    }
});

// ===== CONTENT EXTRACTION ENDPOINTS =====

// Extract content from Google Doc or Sheet
app.post('/api/extract/google-content', async (req, res) => {
    try {
        const { urlOrId } = req.body;
        
        if (!urlOrId) {
            return res.status(400).json({ error: 'URL or ID is required' });
        }

        const contentType = detectContentType(urlOrId);
        const id = extractId(urlOrId);
        
        console.log(`Extracting content from Google ${contentType === 'google_sheet' ? 'Sheet' : 'Doc'}:`, id);
        
        let contentData;
        if (contentType === 'google_sheet') {
            contentData = await extractGoogleSheetContent(id);
        } else {
            contentData = await extractGoogleDocContent(id);
        }
        
        await saveContentToDatabase(contentData, contentType);
        
        res.json({
            success: true,
            message: `Content extracted and saved successfully from ${contentType === 'google_sheet' ? 'Google Sheet' : 'Google Doc'}`,
            data: contentData
        });
    } catch (error) {
        console.error('Error extracting Google content:', error);
        res.status(500).json({ error: 'Failed to extract content', details: error.message });
    }
});

// Extract content from Google Doc (legacy endpoint)
app.post('/api/extract/google-doc', async (req, res) => {
    try {
        const { docId } = req.body;
        
        if (!docId) {
            return res.status(400).json({ error: 'Document ID is required' });
        }

        console.log('Extracting content from Google Doc:', docId);
        
        const contentData = await extractGoogleDocContent(docId);
        await saveContentToDatabase(contentData, 'google_doc');
        
        res.json({
            success: true,
            message: 'Content extracted and saved successfully',
            data: contentData
        });
    } catch (error) {
        console.error('Error extracting Google Doc content:', error);
        res.status(500).json({ error: 'Failed to extract content', details: error.message });
    }
});

// Extract content from Google Sheet
app.post('/api/extract/google-sheet', async (req, res) => {
    try {
        const { sheetId } = req.body;
        
        if (!sheetId) {
            return res.status(400).json({ error: 'Sheet ID is required' });
        }

        console.log('Extracting content from Google Sheet:', sheetId);
        
        const contentData = await extractGoogleSheetContent(sheetId);
        await saveContentToDatabase(contentData, 'google_sheet');
        
        res.json({
            success: true,
            message: 'Content extracted and saved successfully',
            data: contentData
        });
    } catch (error) {
        console.error('Error extracting Google Sheet content:', error);
        res.status(500).json({ error: 'Failed to extract content', details: error.message });
    }
});

// Get all extracted content
app.get('/api/content', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('content_sources')
            .select('*')
            .order('extracted_at', { ascending: false });

        if (error) throw error;
        
        res.json({ content: data || [] });
    } catch (error) {
        console.error('Error fetching content:', error);
        res.status(500).json({ error: 'Failed to fetch content' });
    }
});

// ===== FINE-TUNING ENDPOINTS =====

// Start fine-tuning process
app.post('/api/fine-tune/start', async (req, res) => {
    try {
        console.log('Starting fine-tuning process...');
        
        const result = await startFineTuning();
        
        res.json({
            success: true,
            message: 'Fine-tuning started successfully',
            data: result
        });
    } catch (error) {
        console.error('Error starting fine-tuning:', error);
        res.status(500).json({ error: 'Failed to start fine-tuning', details: error.message });
    }
});

// Get fine-tuning status
app.get('/api/fine-tune/status/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;
        
        const status = await getFineTuneStatus(jobId);
        
        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        console.error('Error getting fine-tuning status:', error);
        res.status(500).json({ error: 'Failed to get fine-tuning status', details: error.message });
    }
});

// ===== MODEL DEPLOYMENT ENDPOINTS =====

// Deploy fine-tuned model
app.post('/api/deploy/model', async (req, res) => {
    try {
        const { jobId } = req.body;
        
        if (!jobId) {
            return res.status(400).json({ error: 'Job ID is required' });
        }

        console.log('Deploying fine-tuned model for job:', jobId);
        
        const result = await deployFineTunedModel(jobId);
        
        res.json({
            success: true,
            message: 'Model deployed successfully',
            data: result
        });
    } catch (error) {
        console.error('Error deploying model:', error);
        res.status(500).json({ error: 'Failed to deploy model', details: error.message });
    }
});

// Get deployed models
app.get('/api/models', async (req, res) => {
    try {
        const models = await getDeployedModels();
        
        res.json({
            success: true,
            data: models
        });
    } catch (error) {
        console.error('Error fetching deployed models:', error);
        res.status(500).json({ error: 'Failed to fetch models', details: error.message });
    }
});

// Switch active model
app.post('/api/models/switch', async (req, res) => {
    try {
        const { modelId } = req.body;
        
        if (!modelId) {
            return res.status(400).json({ error: 'Model ID is required' });
        }

        const result = await switchActiveModel(modelId);
        
        res.json({
            success: true,
            message: 'Active model switched successfully',
            data: result
        });
    } catch (error) {
        console.error('Error switching model:', error);
        res.status(500).json({ error: 'Failed to switch model', details: error.message });
    }
});

// Chat with fine-tuned model
app.post('/api/chat/fine-tuned', async (req, res) => {
    try {
        const { messages, modelName, maxTokens = 1000, temperature = 0.7 } = req.body;
        
        if (!messages || !modelName) {
            return res.status(400).json({ error: 'Messages and model name are required' });
        }

        const response = await callFineTunedModel(modelName, messages, maxTokens, temperature);
        
        res.json({
            success: true,
            data: response
        });
    } catch (error) {
        console.error('Error calling fine-tuned model:', error);
        res.status(500).json({ error: 'Failed to call fine-tuned model', details: error.message });
    }
});

// Enhanced chat with financial data context
app.post('/api/chat/enhanced', async (req, res) => {
    try {
        const { messages, modelName, maxTokens = 1000, temperature = 0.7 } = req.body;
        
        if (!messages || !modelName) {
            return res.status(400).json({ error: 'Messages and model name are required' });
        }

        // Get the latest financial data from the database
        const { data: financialData, error } = await supabase
            .from('content_sources')
            .select('*')
            .eq('source_type', 'google_sheet')
            .order('extracted_at', { ascending: false })
            .limit(1);

        if (error) {
            console.error('Error fetching financial data:', error);
            // Continue without financial data
        }

        // Create enhanced context with financial data
        let enhancedMessages = [...messages];
        
        if (financialData && financialData.length > 0) {
            const latestData = financialData[0];
            const contextMessage = {
                role: "system",
                content: `You have access to the user's financial data. Here is the latest information: ${latestData.title}\n\nKey financial summary:\n- Total assets: ${latestData.metadata?.total || 'Available in data'}\n- Cash: ${latestData.metadata?.cash || 'Available in data'}\n- Stocks: ${latestData.metadata?.stock || 'Available in data'}\n- Real estate: ${latestData.metadata?.house || 'Available in data'}\n- 401K: ${latestData.metadata?.['401K'] || 'Available in data'}\n\nUse this information to provide personalized financial insights and advice.`
            };
            
            enhancedMessages.unshift(contextMessage);
        }

        // Call the fine-tuned model with enhanced context
        const response = await callFineTunedModel(modelName, enhancedMessages, maxTokens, temperature);
        
        res.json({
            success: true,
            data: response,
            context: financialData ? 'Financial data included' : 'No financial data available'
        });
    } catch (error) {
        console.error('Error calling enhanced chat:', error);
        res.status(500).json({ error: 'Failed to call enhanced chat', details: error.message });
    }
});

// ===== MODEL EVALUATION ENDPOINTS =====

// Run automated evaluation
app.post('/api/evaluate/automated', async (req, res) => {
    try {
        console.log('Running automated evaluation...');
        
        const result = await runAutomatedEvaluation();
        
        res.json({
            success: true,
            message: 'Automated evaluation completed',
            data: result
        });
    } catch (error) {
        console.error('Error running automated evaluation:', error);
        res.status(500).json({ error: 'Failed to run evaluation', details: error.message });
    }
});

// Compare specific models
app.post('/api/evaluate/compare', async (req, res) => {
    try {
        const { modelNames } = req.body;
        
        if (!modelNames || !Array.isArray(modelNames)) {
            return res.status(400).json({ error: 'Model names array is required' });
        }

        const result = await compareModels(modelNames);
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error comparing models:', error);
        res.status(500).json({ error: 'Failed to compare models', details: error.message });
    }
});

// Get evaluation history
app.get('/api/evaluate/history', async (req, res) => {
    try {
        const history = await getEvaluationHistory();
        
        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        console.error('Error fetching evaluation history:', error);
        res.status(500).json({ error: 'Failed to fetch evaluation history', details: error.message });
    }
});

// Serve static files explicitly with correct MIME types
app.get('/style.css', (req, res) => {
    res.setHeader('Content-Type', 'text/css');
    res.sendFile(path.join(__dirname, 'style.css'));
});

app.get('/chat.css', (req, res) => {
    res.setHeader('Content-Type', 'text/css');
    res.sendFile(path.join(__dirname, 'chat.css'));
});

app.get('/chat.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.sendFile(path.join(__dirname, 'chat.js'));
});

// Serve pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'chat.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// For local development
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app; 