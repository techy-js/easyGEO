// Background script for HTML to Markdown converter

// Create context menu item
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'convertToMarkdown',
        title: 'Convert page to Markdown',
        contexts: ['page']
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'convertToMarkdown') {
        convertPageToMarkdown(tab);
    }
});

// Handle keyboard shortcuts
chrome.commands.onCommand.addListener((command) => {
    if (command === 'convert-page') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                convertPageToMarkdown(tabs[0]);
            }
        });
    }
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'convertPage') {
        handlePageConversion(request.data, sender.tab);
    }
});

// Convert HTML to Markdown using the content script
async function convertPageToMarkdown(tab) {
    try {
        // Execute script to extract and convert content
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: extractAndConvertPage
        });

        if (results && results[0] && results[0].result) {
            const { markdown, filename } = results[0].result;
            
            await downloadMarkdown(markdown, filename);
            
            // Show success notification
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: showSuccessNotification
            });
        }
    } catch (error) {
        console.error('Conversion error:', error);
        
        // Show error notification
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => showErrorNotification(error.message)
        });
    }
}

// Handle page conversion from content script
async function handlePageConversion(data, tab) {
    try {
        // Execute conversion in content script context where HTML2Markdown is available
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: (data) => {
                const converter = new HTML2Markdown({
                    preserveWhitespace: true,
                    includeImages: true,
                    includeLinks: true,
                    includeTables: true,
                    includeCodeBlocks: true
                });
                
                const markdown = converter.convert(data.html);
                const filename = sanitizeFilename(data.title || 'webpage') + '.md';
                
                return { markdown, filename };
            },
            args: [data]
        });

        if (results && results[0] && results[0].result) {
            const { markdown, filename } = results[0].result;
            await downloadMarkdown(markdown, filename);
            
            // Show success notification
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: showSuccessNotification
            });
        }
    } catch (error) {
        console.error('Conversion error:', error);
    }
}

// Function to be injected for content extraction and conversion
function extractAndConvertPage() {
    const html = document.documentElement.outerHTML;
    const title = document.title;
    
    const converter = new HTML2Markdown({
        preserveWhitespace: true,
        includeImages: true,
        includeLinks: true,
        includeTables: true,
        includeCodeBlocks: true
    });
    
    const markdown = converter.convert(html);
    const filename = sanitizeFilename(title || 'webpage') + '.md';
    
    return { markdown, filename };
    
    function sanitizeFilename(filename) {
        return filename
            .replace(/[<>:"/\\|?*]/g, '')
            .replace(/\s+/g, '_')
            .substring(0, 100);
    }
}

// Function to show success notification
function showSuccessNotification() {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease-out;
    `;
    
    notification.textContent = 'Markdown downloaded successfully!';
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Function to show error notification
function showErrorNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ef4444;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        z-index: 10000;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease-out;
    `;
    
    notification.textContent = 'Conversion failed: ' + message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Sanitize filename
function sanitizeFilename(filename) {
    return filename
        .replace(/[<>:"/\\|?*]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 100);
}

// Download markdown file
async function downloadMarkdown(content, filename) {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    await chrome.downloads.download({
        url: url,
        filename: filename,
        saveAs: false
    });
    
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}