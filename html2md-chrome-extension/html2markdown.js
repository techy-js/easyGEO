// Advanced HTML to Markdown converter
// This module provides comprehensive HTML to Markdown conversion
// while preserving the original structure and content

class HTML2Markdown {
    constructor(options = {}) {
        this.options = {
            preserveWhitespace: true,
            includeImages: true,
            includeLinks: true,
            includeTables: true,
            includeCodeBlocks: true,
            ...options
        };
    }

    convert(html) {
        // Create DOM parser
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Remove unwanted elements but preserve structure
        this.cleanDocument(doc);
        
        // Get the body or fallback to entire document
        const rootElement = doc.body || doc.documentElement;
        
        // Convert to markdown
        let markdown = this.convertElement(rootElement);
        
        // Clean up the final markdown
        return this.cleanMarkdown(markdown);
    }

    cleanDocument(doc) {
        // Remove script, style, and meta elements
        const unwantedElements = doc.querySelectorAll('script, style, noscript, meta, link[rel="stylesheet"]');
        unwantedElements.forEach(el => el.remove());
        
        // Remove comments
        const walker = doc.createTreeWalker(
            doc.body || doc.documentElement,
            NodeFilter.SHOW_COMMENT,
            null,
            false
        );
        
        const comments = [];
        let node;
        while (node = walker.nextNode()) {
            comments.push(node);
        }
        comments.forEach(comment => comment.remove());
    }

    convertElement(element, context = { listDepth: 0, inTable: false }) {
        if (!element) return '';
        
        let result = '';
        
        for (const node of element.childNodes) {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent;
                if (text.trim() || context.inTable) {
                    // Preserve whitespace in certain contexts
                    result += this.processTextNode(text, context);
                }
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                result += this.convertElementNode(node, context);
            }
        }
        
        return result;
    }

    processTextNode(text, context) {
        if (context.inTable) {
            // In tables, preserve text but clean up line breaks
            return text.replace(/\n/g, ' ').replace(/\s+/g, ' ');
        }
        
        // For regular text, preserve meaningful whitespace
        return text;
    }

    convertElementNode(node, context) {
        const tagName = node.tagName.toLowerCase();
        const content = this.convertElement(node, { ...context, inTable: context.inTable || tagName === 'table' });
        
        switch (tagName) {
            // Headings
            case 'h1': return this.formatHeading(content, 1);
            case 'h2': return this.formatHeading(content, 2);
            case 'h3': return this.formatHeading(content, 3);
            case 'h4': return this.formatHeading(content, 4);
            case 'h5': return this.formatHeading(content, 5);
            case 'h6': return this.formatHeading(content, 6);
            
            // Paragraphs and breaks
            case 'p': return this.formatParagraph(content);
            case 'br': return '\n';
            case 'hr': return '\n\n---\n\n';
            
            // Text formatting
            case 'strong':
            case 'b': return this.formatStrong(content);
            case 'em':
            case 'i': return this.formatEmphasis(content);
            case 'u': return this.formatUnderline(content);
            case 'del':
            case 's':
            case 'strike': return this.formatStrikethrough(content);
            case 'mark': return this.formatHighlight(content);
            case 'sup': return this.formatSuperscript(content);
            case 'sub': return this.formatSubscript(content);
            
            // Code
            case 'code': return this.formatInlineCode(content);
            case 'pre': return this.formatCodeBlock(node);
            case 'kbd': return this.formatKeyboard(content);
            case 'samp': return this.formatSample(content);
            case 'var': return this.formatVariable(content);
            
            // Lists
            case 'ul': return this.formatUnorderedList(content, context);
            case 'ol': return this.formatOrderedList(content, context);
            case 'li': return this.formatListItem(content, node, context);
            case 'dl': return this.formatDescriptionList(content);
            case 'dt': return this.formatDescriptionTerm(content);
            case 'dd': return this.formatDescriptionDefinition(content);
            
            // Links and media
            case 'a': return this.formatLink(node, content);
            case 'img': return this.formatImage(node);
            case 'figure': return this.formatFigure(node, content);
            case 'figcaption': return this.formatFigureCaption(content);
            
            // Tables
            case 'table': return this.formatTable(node);
            case 'thead': return content;
            case 'tbody': return content;
            case 'tfoot': return content;
            case 'tr': return content;
            case 'th':
            case 'td': return content;
            
            // Quotes and citations
            case 'blockquote': return this.formatBlockquote(content);
            case 'q': return this.formatQuote(content);
            case 'cite': return this.formatCitation(content);
            
            // Sections and structure
            case 'div':
            case 'section':
            case 'article':
            case 'main':
            case 'header':
            case 'footer':
            case 'nav':
            case 'aside':
            case 'address': return content;
            
            // Spans and inline elements
            case 'span':
            case 'small':
            case 'time':
            case 'abbr':
            case 'acronym': return content;
            
            // Form elements (convert to text representation)
            case 'input': return this.formatInput(node);
            case 'textarea': return this.formatTextarea(node);
            case 'select': return this.formatSelect(node);
            case 'button': return this.formatButton(node, content);
            case 'label': return this.formatLabel(content);
            
            // Details and summary
            case 'details': return this.formatDetails(node, content);
            case 'summary': return this.formatSummary(content);
            
            default:
                // For unknown elements, just return their content
                return content;
        }
    }

    // Formatting methods
    formatHeading(content, level) {
        const trimmed = content.trim();
        if (!trimmed) return '';
        const prefix = '#'.repeat(level);
        return `\n\n${prefix} ${trimmed}\n\n`;
    }

    formatParagraph(content) {
        const trimmed = content.trim();
        if (!trimmed) return '';
        return `\n\n${trimmed}\n\n`;
    }

    formatStrong(content) {
        const trimmed = content.trim();
        return trimmed ? `**${trimmed}**` : content;
    }

    formatEmphasis(content) {
        const trimmed = content.trim();
        return trimmed ? `*${trimmed}*` : content;
    }

    formatUnderline(content) {
        const trimmed = content.trim();
        return trimmed ? `<u>${trimmed}</u>` : content;
    }

    formatStrikethrough(content) {
        const trimmed = content.trim();
        return trimmed ? `~~${trimmed}~~` : content;
    }

    formatHighlight(content) {
        const trimmed = content.trim();
        return trimmed ? `==${trimmed}==` : content;
    }

    formatSuperscript(content) {
        const trimmed = content.trim();
        return trimmed ? `^${trimmed}^` : content;
    }

    formatSubscript(content) {
        const trimmed = content.trim();
        return trimmed ? `~${trimmed}~` : content;
    }

    formatInlineCode(content) {
        const trimmed = content.trim();
        return trimmed ? `\`${trimmed}\`` : content;
    }

    formatCodeBlock(node) {
        const content = node.textContent || '';
        const language = this.getCodeLanguage(node);
        return `\n\n\`\`\`${language}\n${content}\n\`\`\`\n\n`;
    }

    formatKeyboard(content) {
        const trimmed = content.trim();
        return trimmed ? `<kbd>${trimmed}</kbd>` : content;
    }

    formatSample(content) {
        const trimmed = content.trim();
        return trimmed ? `\`${trimmed}\`` : content;
    }

    formatVariable(content) {
        const trimmed = content.trim();
        return trimmed ? `*${trimmed}*` : content;
    }

    formatUnorderedList(content, context) {
        return `\n\n${content}\n\n`;
    }

    formatOrderedList(content, context) {
        return `\n\n${content}\n\n`;
    }

    formatListItem(content, node, context) {
        const parentTag = node.parentElement?.tagName.toLowerCase();
        const trimmed = content.trim();
        
        if (parentTag === 'ul') {
            return `${'  '.repeat(context.listDepth)}- ${trimmed}\n`;
        } else if (parentTag === 'ol') {
            const index = Array.from(node.parentElement.children).indexOf(node) + 1;
            return `${'  '.repeat(context.listDepth)}${index}. ${trimmed}\n`;
        }
        
        return trimmed;
    }

    formatDescriptionList(content) {
        return `\n\n${content}\n\n`;
    }

    formatDescriptionTerm(content) {
        const trimmed = content.trim();
        return trimmed ? `**${trimmed}**\n` : '';
    }

    formatDescriptionDefinition(content) {
        const trimmed = content.trim();
        return trimmed ? `: ${trimmed}\n\n` : '';
    }

    formatLink(node, content) {
        if (!this.options.includeLinks) return content;
        
        const href = node.getAttribute('href');
        const title = node.getAttribute('title');
        const trimmed = content.trim();
        
        if (!href || !trimmed) return content;
        
        // Handle relative URLs
        let url = href;
        if (href.startsWith('//')) {
            url = 'https:' + href;
        } else if (href.startsWith('/')) {
            url = window.location.origin + href;
        }
        
        if (title) {
            return `[${trimmed}](${url} "${title}")`;
        }
        
        return `[${trimmed}](${url})`;
    }

    formatImage(node) {
        if (!this.options.includeImages) return '';
        
        const src = node.getAttribute('src');
        const alt = node.getAttribute('alt') || '';
        const title = node.getAttribute('title');
        
        if (!src) return '';
        
        // Handle relative URLs
        let url = src;
        if (src.startsWith('//')) {
            url = 'https:' + src;
        } else if (src.startsWith('/')) {
            url = window.location.origin + src;
        }
        
        if (title) {
            return `![${alt}](${url} "${title}")`;
        }
        
        return `![${alt}](${url})`;
    }

    formatFigure(node, content) {
        return `\n\n${content}\n\n`;
    }

    formatFigureCaption(content) {
        const trimmed = content.trim();
        return trimmed ? `\n*${trimmed}*\n` : '';
    }

    formatTable(node) {
        if (!this.options.includeTables) return '';
        
        const rows = node.querySelectorAll('tr');
        if (rows.length === 0) return '';
        
        let markdown = '\n\n';
        let isFirstRow = true;
        
        for (const row of rows) {
            const cells = row.querySelectorAll('td, th');
            if (cells.length === 0) continue;
            
            const cellContents = Array.from(cells).map(cell => {
                const cellMarkdown = this.convertElement(cell, { inTable: true });
                return cellMarkdown.trim().replace(/\n/g, ' ').replace(/\|/g, '\\|');
            });
            
            markdown += '| ' + cellContents.join(' | ') + ' |\n';
            
            if (isFirstRow) {
                markdown += '| ' + cellContents.map(() => '---').join(' | ') + ' |\n';
                isFirstRow = false;
            }
        }
        
        return markdown + '\n\n';
    }

    formatBlockquote(content) {
        const trimmed = content.trim();
        if (!trimmed) return '';
        
        const lines = trimmed.split('\n');
        const quotedLines = lines.map(line => `> ${line.trim()}`).join('\n');
        return `\n\n${quotedLines}\n\n`;
    }

    formatQuote(content) {
        const trimmed = content.trim();
        return trimmed ? `"${trimmed}"` : content;
    }

    formatCitation(content) {
        const trimmed = content.trim();
        return trimmed ? `*${trimmed}*` : content;
    }

    formatInput(node) {
        const type = node.getAttribute('type') || 'text';
        const value = node.getAttribute('value') || '';
        const placeholder = node.getAttribute('placeholder') || '';
        
        if (type === 'submit' || type === 'button') {
            return `[${value || 'Button'}]`;
        }
        
        return `[${type}: ${value || placeholder || 'input'}]`;
    }

    formatTextarea(node) {
        const value = node.value || node.textContent || '';
        const placeholder = node.getAttribute('placeholder') || '';
        
        return `[textarea: ${value || placeholder || 'text area'}]`;
    }

    formatSelect(node) {
        const selectedOption = node.querySelector('option[selected]');
        const value = selectedOption?.textContent || 'select';
        
        return `[select: ${value}]`;
    }

    formatButton(node, content) {
        const trimmed = content.trim();
        return `[${trimmed || 'Button'}]`;
    }

    formatLabel(content) {
        return content;
    }

    formatDetails(node, content) {
        const summary = node.querySelector('summary');
        const summaryText = summary ? summary.textContent.trim() : 'Details';
        
        return `\n\n<details>\n<summary>${summaryText}</summary>\n\n${content}\n</details>\n\n`;
    }

    formatSummary(content) {
        return content.trim();
    }

    getCodeLanguage(node) {
        // Try to detect language from class names
        const className = node.className || '';
        const languageMatch = className.match(/language-(\w+)/);
        
        if (languageMatch) {
            return languageMatch[1];
        }
        
        // Check parent element
        const parent = node.parentElement;
        if (parent) {
            const parentClass = parent.className || '';
            const parentLanguageMatch = parentClass.match(/language-(\w+)/);
            if (parentLanguageMatch) {
                return parentLanguageMatch[1];
            }
        }
        
        return '';
    }

    cleanMarkdown(markdown) {
        return markdown
            // Remove excessive blank lines
            .replace(/\n{4,}/g, '\n\n\n')
            // Clean up spaces around formatting
            .replace(/\*\*\s+/g, '**')
            .replace(/\s+\*\*/g, '**')
            .replace(/\*\s+/g, '*')
            .replace(/\s+\*/g, '*')
            // Clean up list formatting
            .replace(/\n\n-/g, '\n-')
            .replace(/\n\n\d+\./g, '\n1.')
            // Remove trailing whitespace
            .replace(/[ \t]+$/gm, '')
            // Trim the final result
            .trim();
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HTML2Markdown;
} else if (typeof window !== 'undefined') {
    window.HTML2Markdown = HTML2Markdown;
}
