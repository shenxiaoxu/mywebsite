const express = require('express');
const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static('.'));

// ChatGPT API endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { messages, model = 'gpt-3.5-turbo', max_tokens = 1000, temperature = 0.7 } = req.body;

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
        res.json(data);

    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve the chat page
app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'chat.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Chat interface available at http://localhost:${PORT}/chat`);
}); 