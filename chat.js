// Simple test to see if JavaScript is working
console.log('Chat.js loaded!');

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded!');
    
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const chatForm = document.getElementById('chatForm');
    const chatMessages = document.getElementById('chatMessages');
    const modelRadios = document.querySelectorAll('input[name="model"]');
    const enhancedToggle = document.getElementById('enhancedMode');
    const modelInfo = document.getElementById('currentModelInfo');
    const sampleQuestions = document.getElementById('sampleQuestions');
    const questionChips = document.querySelectorAll('.question-chip');
    
    console.log('Message input:', messageInput);
    console.log('Send button:', sendButton);
    
    if (!messageInput || !sendButton) {
        console.error('Could not find input or button elements');
        return;
    }
    
    // Function to update model info display
    function updateModelInfo() {
        const selectedModel = document.querySelector('input[name="model"]:checked').value;
        const isEnhanced = enhancedToggle.checked;
        
        let modelName = selectedModel === 'ft:gpt-3.5-turbo-0125:mikeempire::C5w66Ksb' ? 'Fine-Tuned Financial Expert' : 'GPT-4o';
        let enhancedText = isEnhanced ? 'with Enhanced Mode' : '';
        
        modelInfo.textContent = `Using: ${modelName} ${enhancedText}`;
        
        // Show/hide sample questions based on model selection
        if (selectedModel === 'ft:gpt-3.5-turbo-0125:mikeempire::C5w66Ksb') {
            sampleQuestions.style.display = 'block';
        } else {
            sampleQuestions.style.display = 'none';
        }
    }
    
    // Add event listeners for model selection
    modelRadios.forEach(radio => {
        radio.addEventListener('change', updateModelInfo);
    });
    
    enhancedToggle.addEventListener('change', updateModelInfo);
    
    // Add event listeners for sample question chips
    questionChips.forEach(chip => {
        chip.addEventListener('click', function() {
            const question = this.getAttribute('data-question');
            messageInput.value = question;
            messageInput.focus();
            sendButton.disabled = false;
        });
    });
    
    // Initialize model info
    updateModelInfo();
    
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
        
        // Get selected model and enhanced mode
        const selectedModel = document.querySelector('input[name="model"]:checked').value;
        const isEnhanced = enhancedToggle.checked;
        
        // Determine API endpoint
        let apiEndpoint = '/api/chat'; // Default
        if (selectedModel === 'ft:gpt-3.5-turbo-0125:mikeempire::C5w66Ksb' && isEnhanced) {
            apiEndpoint = '/api/chat/enhanced';
        } else if (selectedModel === 'ft:gpt-3.5-turbo-0125:mikeempire::C5w66Ksb' && !isEnhanced) {
            apiEndpoint = '/api/chat/fine-tuned';
        }
        
        console.log('Using API endpoint:', apiEndpoint);
        console.log('Selected model:', selectedModel);
        console.log('Enhanced mode:', isEnhanced);
        
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
        
        // Prepare request body based on endpoint
        let requestBody = {
            messages: [{ role: 'user', content: message }],
            max_tokens: 1000,
            temperature: 0.7
        };
        
        if (apiEndpoint === '/api/chat') {
            requestBody.model = selectedModel;
        } else {
            requestBody.modelName = selectedModel;
        }
        
        // Call API
        fetch(apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Session-ID': 'session-' + Date.now()
            },
            body: JSON.stringify(requestBody)
        })
        .then(response => response.json())
        .then(data => {
            // Remove typing indicator
            const typingIndicator = document.getElementById('typingIndicator');
            if (typingIndicator) {
                typingIndicator.remove();
            }
            
            // Add AI response
            let aiResponse;
            if (data.choices && data.choices[0]) {
                aiResponse = data.choices[0].message.content;
            } else if (data.data && data.data.choices && data.data.choices[0]) {
                aiResponse = data.data.choices[0].message.content;
            } else {
                aiResponse = 'Sorry, I received an unexpected response format.';
            }
            
            const aiDiv = document.createElement('div');
            aiDiv.className = 'message ai-message';
            aiDiv.innerHTML = `
                <div class="message-content">
                    <p>${aiResponse}</p>
                    ${data.context ? `<small style="opacity: 0.7; font-style: italic;">${data.context}</small>` : ''}
                    <small style="opacity: 0.6; display: block; margin-top: 8px; font-size: 11px;">
                        🤖 ${selectedModel === 'ft:gpt-3.5-turbo-0125:mikeempire::C5w66Ksb' ? 'Fine-Tuned Financial Expert' : 'GPT-4o'}${isEnhanced ? ' (Enhanced)' : ''}
                    </small>
                </div>
            `;
            chatMessages.appendChild(aiDiv);
            
            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
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
                    <small style="opacity: 0.7;">Error: ${error.message}</small>
                </div>
            `;
            chatMessages.appendChild(errorDiv);
            
            // Scroll to bottom
            chatMessages.scrollTop = chatMessages.scrollHeight;
        });
    });
    
    console.log('Event listeners attached!');
}); 