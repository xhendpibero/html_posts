/**
 * UI utility functions for common operations
 * @namespace UI
 */
const UI = (() => {
  // Private variables and utility functions
  const ERROR_DISPLAY_TIME = 5000; // 5 seconds
  const MOBILE_BREAKPOINT = 768;

  /**
   * Internal helper to validate input
   * @private
   * @param {*} value - Value to validate
   * @param {string} type - Expected type
   * @param {*} defaultValue - Default value to return if validation fails
   * @returns {*} - The validated value or default
   */
  const _validateInput = (value, type, defaultValue) => {
    if (value === null || value === undefined || typeof value !== type) {
      console.warn(`Expected ${type}, got ${typeof value}`);
      return defaultValue;
    }
    return value;
  };

  /**
   * Internal helper to check if the device is mobile
   * @private
   * @returns {boolean} - True if on mobile device
   */
  const _isMobileDevice = () => {
    return (
      window.innerWidth < MOBILE_BREAKPOINT ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      )
    );
  };

  // Public API UI
  return {
    /**
     * Create an HTML element with specified attributes and content
     * @param {string} tag - HTML tag
     * @param {Object} attributes - Element attributes
     * @param {string|HTMLElement|Array} content - Element content
     * @returns {HTMLElement} - Created element
     */
    createElement(tag, attributes = {}, content = "") {
      tag = _validateInput(tag, "string", "div");

      const element = document.createElement(tag);

      // Set attributes
      if (attributes && typeof attributes === "object") {
        Object.entries(attributes).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            element.setAttribute(key, String(value));
          }
        });
      }

      // Set content
      if (content) {
        if (typeof content === "string") {
          element.textContent = content;
        } else if (content instanceof HTMLElement) {
          element.appendChild(content);
        } else if (Array.isArray(content)) {
          content.forEach((item) => {
            if (item instanceof HTMLElement) {
              element.appendChild(item);
            }
          });
        }
      }

      return element;
    },

    /**
     * Create multiple elements efficiently using a document fragment
     * @param {Array} elements - Array of element configs: {tag, attributes, content}
     * @returns {DocumentFragment} - Document fragment containing all elements
     */
    createElementsFragment(elements) {
      const fragment = document.createDocumentFragment();

      elements.forEach((config) => {
        if (config && config.tag) {
          const element = this.createElement(
            config.tag,
            config.attributes || {},
            config.content || ""
          );
          fragment.appendChild(element);
        }
      });

      return fragment;
    },

    /**
     * Append multiple children to a parent element
     * @param {HTMLElement} parent - Parent element
     * @param {Array<HTMLElement>} children - Array of child elements
     * @returns {HTMLElement} - The parent element
     */
    appendChildren(parent, children) {
      if (!(parent instanceof HTMLElement)) {
        console.error("Parent must be an HTML element");
        return parent;
      }

      if (!Array.isArray(children)) {
        console.error("Children must be an array");
        return parent;
      }

      const fragment = document.createDocumentFragment();

      children.forEach((child) => {
        if (child instanceof HTMLElement) {
          fragment.appendChild(child);
        }
      });

      parent.appendChild(fragment);
      return parent;
    },

    /**
     * Show/hide loading indicator
     * @param {boolean} show - Whether to show or hide
     * @param {string} [elementId='loading'] - ID of loading element
     */
    toggleLoading(show, elementId = "loading") {
      const loadingEl = document.getElementById(elementId);
      if (loadingEl) {
        loadingEl.style.display = show ? "block" : "none";
      }
    },

    /**
     * Highlight text containing a specific keyword
     * @param {string} text - Original text
     * @param {string} keyword - Keyword to highlight
     * @param {string} [highlightClass='highlight'] - CSS class for highlight
     * @returns {string} - HTML with highlighted keyword
     */
    highlightText(
      text,
      keyword,
      highlightClass = "highlight",
      exactWordOnly = true
    ) {
      if (!keyword || !text) return text;

      text = _validateInput(text, "string", "");
      keyword = _validateInput(keyword, "string", "");

      try {
        let regex;
        if (exactWordOnly) {
          // Use word boundaries \b to match only whole words
          regex = new RegExp(`\\b(${this.escapeRegExp(keyword)})\\b`, "gi");
        } else {
          // Match the keyword anywhere in the text
          regex = new RegExp(`(${this.escapeRegExp(keyword)})`, "gi");
        }

        return text.replace(regex, `<span class="${highlightClass}">$1</span>`);
      } catch (e) {
        console.error("Error highlighting text:", e);
        return text;
      }
    },

    /**
     * Escape special regex characters
     * @param {string} text - Text to escape
     * @returns {string} - Escaped text
     */
    escapeRegExp(text) {
      return _validateInput(text, "string", "").replace(
        /[-[\]{}()*+?.,\\^$|#\s]/g,
        "\\$&"
      );
    },

    /**
     * Sanitize HTML to prevent XSS attacks
     * @param {string} html - HTML string to sanitize
     * @param {Object} [options] - Sanitization options
     * @param {boolean} [options.allowLinks=false] - Allow safe links
     * @param {string[]} [options.allowedTags=[]] - Additional allowed tags
     * @returns {string} - Sanitized HTML
     */
    sanitizeHTML(html, options = {}) {
      if (!html) return "";

      html = _validateInput(html, "string", "");
      const { allowLinks = false, allowedTags = [] } = options;

      // Create a DOM parser to parse the HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      // Get all script tags and remove them
      const scripts = doc.querySelectorAll(
        "script, iframe, object, embed, form"
      );
      scripts.forEach((script) => script.remove());

      // Remove event handlers from all elements
      const allElements = doc.querySelectorAll("*");
      allElements.forEach((element) => {
        const attributesToRemove = [];

        for (let i = 0; i < element.attributes.length; i++) {
          const attr = element.attributes[i];
          // Remove event handlers and dangerous attributes
          if (
            attr.name.startsWith("on") ||
            (attr.name === "href" && attr.value.startsWith("javascript:")) ||
            (attr.name === "src" && attr.value.startsWith("javascript:"))
          ) {
            attributesToRemove.push(attr.name);
          }
        }

        attributesToRemove.forEach((attr) => element.removeAttribute(attr));

        // Handle links separately if allowed
        if (
          allowLinks &&
          element.tagName === "A" &&
          element.hasAttribute("href")
        ) {
          const href = element.getAttribute("href");
          if (href && !href.startsWith("javascript:")) {
            // Add security attributes to links
            element.setAttribute("rel", "noopener noreferrer");
            element.setAttribute("target", "_blank");
          } else {
            element.removeAttribute("href");
          }
        }
      });

      // Remove unwanted tags, keeping only allowed ones
      const defaultAllowedTags = [
        "p",
        "br",
        "b",
        "i",
        "em",
        "strong",
        "span",
        "div",
        "ul",
        "ol",
        "li",
      ];
      const finalAllowedTags = [
        ...new Set([...defaultAllowedTags, ...allowedTags]),
      ];

      document.createTreeWalker(doc.body, NodeFilter.SHOW_ELEMENT, {
        acceptNode: (node) => {
          return finalAllowedTags.includes(node.tagName.toLowerCase())
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        },
      });

      // Return the sanitized HTML
      return doc.body.innerHTML;
    },

    /**
     * Display error message
     * @param {string} message - Error message
     * @param {Object} [options] - Error display options
     * @param {string} [options.containerId='error-alert'] - ID of the error container
     * @param {number} [options.duration=5000] - Time in ms to display the error
     * @param {boolean} [options.isHtml=false] - Whether message contains HTML
     */
    showError(message, options = {}) {
      const {
        containerId = "error-alert",
        duration = ERROR_DISPLAY_TIME,
        isHtml = false,
      } = options;

      const errorContainer = document.getElementById(containerId);

      if (errorContainer) {
        if (isHtml) {
          errorContainer.innerHTML = this.sanitizeHTML(message);
        } else {
          errorContainer.textContent = message;
        }

        errorContainer.style.display = "block";

        // Auto-hide after specified duration
        if (duration > 0) {
          setTimeout(() => {
            this.hideError(containerId);
          }, duration);
        }
      } else {
        console.error(message);
        alert(`Error: ${message}`);
      }
    },

    /**
     * Hide error message
     * @param {string} [containerId='error-alert'] - ID of the error container
     */
    hideError(containerId = "error-alert") {
      const errorContainer = document.getElementById(containerId);
      if (errorContainer) {
        errorContainer.style.display = "none";
      }
    },

    /**
     * Create pagination controls
     * @param {number} currentPage - Current page number
     * @param {number} totalPages - Total number of pages
     * @param {Function} onPageChange - Callback when page changes
     * @param {Object} [options] - Pagination options
     * @param {number} [options.pagesShown=5] - Number of page links to show
     * @param {boolean} [options.showFirstLast=false] - Show first/last page buttons
     * @returns {HTMLElement} - Pagination element
     */
    createPagination(currentPage, totalPages, onPageChange, options = {}) {
      const { pagesShown = 5, showFirstLast = false } = options;

      // Create navigation container
      const paginationNav = this.createElement("nav", {
        "aria-label": "Pagination",
        class: "pagination-container",
      });

      const ul = this.createElement("ul", {
        class: "pagination justify-content-center",
      });

      // Calculate start and end pages
      const halfPagesShown = Math.floor(pagesShown / 2);
      let startPage = Math.max(1, currentPage - halfPagesShown);
      let endPage = Math.min(totalPages, startPage + pagesShown - 1);

      // Adjust start page if we're near the end
      if (endPage - startPage + 1 < pagesShown) {
        startPage = Math.max(1, endPage - pagesShown + 1);
      }

      // Create the pagination elements
      const paginationItems = [];

      // First page button
      if (showFirstLast && currentPage > 1) {
        paginationItems.push({
          type: "first",
          text: "«",
          page: 1,
          active: false,
          disabled: currentPage === 1,
        });
      }

      // Previous button
      paginationItems.push({
        type: "prev",
        text: "Previous",
        page: currentPage - 1,
        active: false,
        disabled: currentPage === 1,
      });

      // Page number buttons
      for (let i = startPage; i <= endPage; i++) {
        paginationItems.push({
          type: "page",
          text: i.toString(),
          page: i,
          active: i === currentPage,
          disabled: false,
        });
      }

      // Next button
      paginationItems.push({
        type: "next",
        text: "Next",
        page: currentPage + 1,
        active: false,
        disabled: currentPage === totalPages,
      });

      // Last page button
      if (showFirstLast && currentPage < totalPages) {
        paginationItems.push({
          type: "last",
          text: "»",
          page: totalPages,
          active: false,
          disabled: currentPage === totalPages,
        });
      }

      // Create elements from configuration
      paginationItems.forEach((item) => {
        const li = this.createElement("li", {
          class: `page-item ${item.active ? "active" : ""} ${
            item.disabled ? "disabled" : ""
          }`,
        });

        const a = this.createElement(
          "a",
          {
            class: "page-link",
            href: "#",
            "aria-label": item.text,
          },
          item.text
        );

        if (!item.disabled && !item.active) {
          a.addEventListener("click", (e) => {
            e.preventDefault();
            onPageChange(item.page);
          });
        }

        li.appendChild(a);
        ul.appendChild(li);
      });

      paginationNav.appendChild(ul);
      return paginationNav;
    },

    /**
     * Debounce a function to prevent rapid firing
     * @param {Function} func - Function to debounce
     * @param {number} [delay=300] - Delay in milliseconds
     * @param {boolean} [immediate=false] - Whether to trigger on leading edge
     * @returns {Function} - Debounced function
     */
    debounce(func, delay = 300, immediate = false) {
      let timeout;

      return function () {
        const context = this;
        const args = arguments;

        const later = function () {
          timeout = null;
          if (!immediate) func.apply(context, args);
        };

        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, delay);

        if (callNow) func.apply(context, args);
      };
    },

    /**
     * Throttle a function to limit how often it can fire
     * @param {Function} func - Function to throttle
     * @param {number} [limit=300] - Time limit in milliseconds
     * @returns {Function} - Throttled function
     */
    throttle(func, limit = 300) {
      let lastCall = 0;

      return function (...args) {
        const now = Date.now();
        if (now - lastCall >= limit) {
          lastCall = now;
          func.apply(this, args);
        }
      };
    },

    /**
     * Format date to human-readable string
     * @param {string|Date} date - Date to format
     * @param {Object} [options] - Formatting options
     * @param {string} [options.format='medium'] - Format style: 'short', 'medium', 'long', 'full'
     * @param {string} [options.locale] - Locale string (e.g., 'en-US')
     * @returns {string} - Formatted date
     */
    formatDate(date, options = {}) {
      if (!date) return "";

      const { format = "medium", locale = navigator.language } = options;

      try {
        const dateObj = date instanceof Date ? date : new Date(date);
        if (isNaN(dateObj)) return "";

        const formatOptions = {
          short: {
            year: "numeric",
            month: "numeric",
            day: "numeric",
          },
          medium: {
            year: "numeric",
            month: "short",
            day: "numeric",
          },
          long: {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          },
          full: {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "long",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          },
        };

        return dateObj.toLocaleDateString(
          locale,
          formatOptions[format] || formatOptions.medium
        );
      } catch (e) {
        console.error("Error formatting date:", e);
        return "";
      }
    },
    /**
     * Truncate text to a specified length
     * @param {string} text - Text to truncate
     * @param {Object} [options] - Truncation options
     * @param {number} [options.maxLength=100] - Maximum length
     * @param {string} [options.suffix='...'] - Suffix to add to truncated text
     * @param {boolean} [options.preserveWords=false] - Whether to preserve whole words
     * @returns {string} - Truncated text
     */
    truncateText(text, options = {}) {
      if (!text) return "";

      const {
        maxLength = 100,
        suffix = "...",
        preserveWords = false,
      } = options;

      text = _validateInput(text, "string", "");

      if (text.length <= maxLength) return text;

      if (preserveWords) {
        // Truncate at word boundary
        let truncated = text.substring(0, maxLength);
        const lastSpaceIndex = truncated.lastIndexOf(" ");

        if (lastSpaceIndex > 0) {
          truncated = truncated.substring(0, lastSpaceIndex);
        }

        return truncated + suffix;
      }

      // Simple truncation
      return text.substring(0, maxLength) + suffix;
    },

    /**
     * Initialize tooltips for mobile devices
     * @param {Object} [options] - Tooltip options
     * @param {string} [options.selector='.custom-tooltip'] - Tooltip selector
     * @param {string} [options.activeClass='active'] - Active state class
     */
    initTooltips(options = {}) {
      const { selector = ".custom-tooltip", activeClass = "active" } = options;

      if (_isMobileDevice()) {
        const tooltips = document.querySelectorAll(selector);

        // Remove any existing listeners (prevents duplicates)
        tooltips.forEach((tooltip) => {
          const newTooltip = tooltip.cloneNode(true);
          tooltip.parentNode.replaceChild(newTooltip, tooltip);
        });

        // Add click listeners to tooltips
        document.querySelectorAll(selector).forEach((tooltip) => {
          tooltip.addEventListener("click", function (e) {
            // Toggle active class to show/hide tooltip
            const currentActive = document.querySelector(
              `${selector}.${activeClass}`
            );
            if (currentActive && currentActive !== this) {
              currentActive.classList.remove(activeClass);
            }
            this.classList.toggle(activeClass);
            e.stopPropagation();
          });
        });

        // Hide tooltips when clicking elsewhere
        document.addEventListener("click", function () {
          const activeTooltip = document.querySelector(
            `${selector}.${activeClass}`
          );
          if (activeTooltip) {
            activeTooltip.classList.remove(activeClass);
          }
        });
      }
    },
  };
})();
