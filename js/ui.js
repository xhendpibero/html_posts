/**
 * UI utility functions for common operations
 * @class UI
 */
class UI {
    /**
     * Create an HTML element with specified attributes and content
     * @param {string} tag - HTML tag
     * @param {Object} attributes - Element attributes
     * @param {string|HTMLElement|Array} content - Element content
     * @returns {HTMLElement} - Created element
     */
    static createElement(tag, attributes = {}, content = '') {
        if (!tag || typeof tag !== 'string') {
            console.error('Invalid tag provided to createElement');
            return document.createElement('div');
        }
        
        const element = document.createElement(tag);
        
        // Set attributes
        if (attributes && typeof attributes === 'object') {
            Object.entries(attributes).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    element.setAttribute(key, String(value));
                }
            });
        }
        
        // Set content
        if (content) {
            if (typeof content === 'string') {
                element.textContent = content;
            } else if (content instanceof HTMLElement) {
                element.appendChild(content);
            } else if (Array.isArray(content)) {
                content.forEach(item => {
                    if (item instanceof HTMLElement) {
                        element.appendChild(item);
                    }
                });
            }
        }
        
        return element;
    }

    /**
     * Show loading indicator
     * @param {boolean} show - Whether to show or hide
     */
    static toggleLoading(show) {
        const loadingEl = document.getElementById('loading');
        if (loadingEl) {
            loadingEl.style.display = show ? 'block' : 'none';
        }
    }

    /**
     * Highlight text containing a specific keyword
     * @param {string} text - Original text
     * @param {string} keyword - Keyword to highlight
     * @returns {string} - HTML with highlighted keyword
     */
    static highlightText(text, keyword) {
        if (!keyword || !text) return text;
        
        const regex = new RegExp(`(${UI.escapeRegExp(keyword)})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    }

    /**
     * Escape special regex characters
     * @param {string} text - Text to escape
     * @returns {string} - Escaped text
     */
    static escapeRegExp(text) {
        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    }

    /**
     * Sanitize HTML to prevent XSS attacks
     * @param {string} html - HTML string to sanitize
     * @returns {string} - Sanitized HTML
     */
    static sanitizeHTML(html) {
        if (!html) return '';
        const temp = document.createElement('div');
        temp.textContent = html;
        return temp.innerHTML;
    }

    /**
     * Display error message
     * @param {string} message - Error message
     * @param {string} containerId - ID of the error container element
     */
    static showError(message, containerId = 'error-alert') {
        const errorContainer = document.getElementById(containerId);
        if (errorContainer) {
            errorContainer.textContent = message;
            errorContainer.style.display = 'block';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                errorContainer.style.display = 'none';
            }, 5000);
        } else {
            console.error(message);
            alert(`Error: ${message}`);
        }
    }

    /**
     * Hide error message
     * @param {string} containerId - ID of the error container element
     */
    static hideError(containerId = 'error-alert') {
        const errorContainer = document.getElementById(containerId);
        if (errorContainer) {
            errorContainer.style.display = 'none';
        }
    }

    /**
     * Create pagination controls
     * @param {number} currentPage - Current page number
     * @param {number} totalPages - Total number of pages
     * @param {Function} onPageChange - Callback when page changes
     * @returns {HTMLElement} - Pagination element
     */
    static createPagination(currentPage, totalPages, onPageChange) {
        const paginationNav = UI.createElement('nav', {
            'aria-label': 'Posts pagination'
        });
        
        const ul = UI.createElement('ul', {
            class: 'pagination justify-content-center'
        });
        
        // Previous button
        const prevLi = UI.createElement('li', {
            class: `page-item ${currentPage === 1 ? 'disabled' : ''}`
        });
        
        const prevLink = UI.createElement('a', {
            class: 'page-link',
            href: '#',
            'aria-label': 'Previous'
        }, 'Previous');
        
        if (currentPage > 1) {
            prevLink.addEventListener('click', (e) => {
                e.preventDefault();
                onPageChange(currentPage - 1);
            });
        }
        
        prevLi.appendChild(prevLink);
        ul.appendChild(prevLi);
        
        // Page numbers
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, startPage + 4);
        
        for (let i = startPage; i <= endPage; i++) {
            const pageLi = UI.createElement('li', {
                class: `page-item ${i === currentPage ? 'active' : ''}`
            });
            
            const pageLink = UI.createElement('a', {
                class: 'page-link',
                href: '#'
            }, i.toString());
            
            if (i !== currentPage) {
                pageLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    onPageChange(i);
                });
            }
            
            pageLi.appendChild(pageLink);
            ul.appendChild(pageLi);
        }
        
        // Next button
        const nextLi = UI.createElement('li', {
            class: `page-item ${currentPage === totalPages ? 'disabled' : ''}`
        });
        
        const nextLink = UI.createElement('a', {
            class: 'page-link',
            href: '#',
            'aria-label': 'Next'
        }, 'Next');
        
        if (currentPage < totalPages) {
            nextLink.addEventListener('click', (e) => {
                e.preventDefault();
                onPageChange(currentPage + 1);
            });
        }
        
        nextLi.appendChild(nextLink);
        ul.appendChild(nextLi);
        
        paginationNav.appendChild(ul);
        return paginationNav;
    }

    /**
     * Debounce a function to prevent rapid firing
     * @param {Function} func - Function to debounce
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} - Debounced function
     */
    static debounce(func, delay = 300) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }

    /**
     * Format date to human-readable string
     * @param {string} dateString - ISO date string
     * @returns {string} - Formatted date
     */
    static formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date)) return '';
        
        return date.toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * Truncate text to a specified length
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} - Truncated text
     */
    static truncateText(text, maxLength = 100) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
}