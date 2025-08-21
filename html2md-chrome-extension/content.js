// Content script for HTML to Markdown converter
// This script runs in the context of web pages

// Listen for messages from popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractContent') {
        try {
            const result = extractPageContent();
            sendResponse({ success: true, data: result });
        } catch (error) {
            sendResponse({ success: false, error: error.message });
        }
    }
    return true; // Keep the message channel open for async response
});

// Extract complete page content
function extractPageContent() {
    // Get the complete HTML content
    const html = document.documentElement.outerHTML;
    const title = document.title;
    const url = window.location.href;
    
    // Also get the visible text content for better structure preservation
    const bodyHTML = document.body ? document.body.outerHTML : html;
    
    return {
        html: html,
        bodyHTML: bodyHTML,
        title: title,
        url: url,
        timestamp: new Date().toISOString()
    };
}

// Add keyboard shortcut listener
document.addEventListener('keydown', function(event) {
    // Check for Ctrl+Shift+M (or Cmd+Shift+M on Mac)
    if (event.shiftKey && event.metaKey && event.key === 'M') {
        event.preventDefault();
        convertCurrentPage();
    } else if (event.shiftKey && event.ctrlKey && event.key === 'M') {
        event.preventDefault();
        convertCurrentPage();
    }
});

// Convert current page (triggered by keyboard shortcut)
function convertCurrentPage() {
    chrome.runtime.sendMessage({
        action: 'convertPage',
        data: extractPageContent()
    });
}

// Add visual feedback when conversion starts
function showConversionFeedback() {
    // Create a temporary notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4ade80;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease-out;
    `;
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
    
    notification.textContent = 'Converting to Markdown...';
    document.body.appendChild(notification);
    
    // Remove notification after 2 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
        }, 300);
    }, 2000);
}