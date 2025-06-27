const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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
        const { messages, model = 'gpt-3.5-turbo', max_tokens = 1000, temperature = 0.7 } = req.body;
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

// For local development
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app; 