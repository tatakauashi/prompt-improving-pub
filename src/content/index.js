chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'GET_PROMPT') {
        try {
            const activeElement = document.activeElement;
            let promptText = '';

            // Try active element first
            if (activeElement && (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT')) {
                promptText = activeElement.value;
            } else if (activeElement && activeElement.isContentEditable) {
                promptText = activeElement.innerText;
            }

            // Fallback: try to find common chat input selectors
            if (!promptText) {
                // ChatGPT selector (may change over time)
                const chatGPTInput = document.querySelector('textarea[placeholder*="Message"], div[contenteditable="true"]');
                if (chatGPTInput) {
                    promptText = chatGPTInput.value || chatGPTInput.innerText || chatGPTInput.textContent || '';
                }
            }

            console.log('Content script captured:', promptText);
            sendResponse({ prompt: promptText });
        } catch (error) {
            console.error('Content script error:', error);
            sendResponse({ prompt: '', error: error.message });
        }
        return true; // Required for async sendResponse
    }
});
