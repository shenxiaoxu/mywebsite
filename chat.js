// Simple test to see if JavaScript is working
console.log('Chat.js loaded!');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded!');
    
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const chatForm = document.getElementById('chatForm');
    const chatMessages = document.getElementById('chatMessages');
    
    console.log('Message input:', messageInput);
    console.log('Send button:', sendButton);
    
    if (!messageInput || !sendButton) {
        console.error('Could not find input or button elements');
        return;
    }
    
    // Enable/disable send button based on input
    messageInput.addEventListener('input', function() {
        const hasText = messageInput.value.trim().length > 0;
        sendButton.disabled = !hasText;
        console.log('Input changed, has text:', hasText);
    });
    
    // Handle form submission
    chatForm.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Form submitted!');
        
        const message = messageInput.value.trim();
        if (!message) return;
        
        console.log('Sending message:', message);
        
        // Add user message to chat
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message user-message';
        messageDiv.innerHTML = `
            <div class="message-content">
                <p>${message}</p>
            </div>
        `;
        chatMessages.appendChild(messageDiv);
        
        // Clear input
        messageInput.value = '';
        sendButton.disabled = true;
        
        // Show typing indicator
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message ai-message';
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = `
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        chatMessages.appendChild(typingDiv);
        
        // Call API
        fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-ID': 'session-' + Date.now()
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: message }],
                model: 'gpt-3.5-turbo',
                max_tokens: 1000,
                temperature: 0.7
            })
        })
        .then(response => response.json())
        .then(data => {
            // Remove typing indicator
            const typingIndicator = document.getElementById('typingIndicator');
            if (typingIndicator) {
                typingIndicator.remove();
            }
            
            // Add AI response
            const aiResponse = data.choices[0].message.content;
            const aiDiv = document.createElement('div');
            aiDiv.className = 'message ai-message';
            aiDiv.innerHTML = `
                <div class="message-content">
                    <p>${aiResponse}</p>
                </div>
            `;
            chatMessages.appendChild(aiDiv);
        })
        .catch(error => {
            console.error('API Error:', error);
            
            // Remove typing indicator
            const typingIndicator = document.getElementById('typingIndicator');
            if (typingIndicator) {
                typingIndicator.remove();
            }
            
            // Show error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'message ai-message';
            errorDiv.innerHTML = `
                <div class="message-content error-message">
                    <p>Sorry, I encountered an error. Please try again.</p>
                </div>
            `;
            chatMessages.appendChild(errorDiv);
        });
    });
    
    console.log('Event listeners attached!');
}); 