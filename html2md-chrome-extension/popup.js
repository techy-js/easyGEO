document.addEventListener('DOMContentLoaded', function() {
    const convertBtn = document.getElementById('convertBtn');
    const status = document.getElementById('status');
    const loading = document.getElementById('loading');

    convertBtn.addEventListener('click', async function() {
        try {
            // Show loading state
            convertBtn.disabled = true;
            status.style.display = 'none';
            loading.style.display = 'flex';

            // Get the active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab) {
                throw new Error('No active tab found');
            }

            // Execute content script to extract HTML
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: extractPageContent
            });

            if (!results || !results[0] || !results[0].result) {
                throw new Error('Failed to extract page content');
            }

            const { html, title, url } = results[0].result;
            
            // Convert HTML to Markdown
            const markdown = htmlToMarkdown(html);
            
            // Download the markdown file
            const filename = sanitizeFilename(title || 'webpage') + '.md';
            await downloadMarkdown(markdown, filename);

            // Show success
            loading.style.display = 'none';
            status.style.display = 'flex';
            status.className = 'status success';
            status.textContent = 'Downloaded successfully!';
            
            // Close popup after a delay
            setTimeout(() => {
                window.close();
            }, 1500);

        } catch (error) {
            console.error('Conversion error:', error);
            loading.style.display = 'none';
            status.style.display = 'flex';
            status.className = 'status error';
            status.textContent = 'Error: ' + error.message;
        } finally {
            convertBtn.disabled = false;
        }
    });
});

// Function to be injected into the page
function extractPageContent() {
    // Get the complete HTML content
    const html = document.documentElement.outerHTML;
    const title = document.title;
    const url = window.location.href;
    
    return { html, title, url };
}

// Convert HTML to Markdown using the advanced converter
function htmlToMarkdown(html) {
    const converter = new HTML2Markdown({
        preserveWhitespace: true,
        includeImages: true,
        includeLinks: true,
        includeTables: true,
        includeCodeBlocks: true
    });
    
    return converter.convert(html);
}

// Sanitize filename
function sanitizeFilename(filename) {
    return filename
        .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .substring(0, 100); // Limit length
}

// Download markdown file
async function downloadMarkdown(content, filename) {
    // The HTML2Markdown converter already provides clean content
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    await chrome.downloads.download({
        url: url,
        filename: filename,
        saveAs: false
    });
    
    // Clean up the blob URL
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}