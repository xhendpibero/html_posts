/**
 * Simple test framework for the application
 * @class TestRunner
 */
class TestRunner {
    /**
     * Create a test runner instance
     */
    constructor() {
        this.tests = [];
        this.passedTests = 0;
    }

    /**
     * Add a test
     * @param {string} description - Test description
     * @param {Function} testFn - Test function
     */
    addTest(description, testFn) {
        this.tests.push({ description, testFn });
    }

    /**
     * Run all tests
     */
    async runTests() {
        console.group('Running tests...');
        
        for (const test of this.tests) {
            try {
                await test.testFn();
                console.log(`✅ PASS: ${test.description}`);
                this.passedTests++;
            } catch (error) {
                console.error(`❌ FAIL: ${test.description}: ${error.message}`);
            }
        }
        
        console.log(`Tests completed: ${this.passedTests}/${this.tests.length} passed`);
        console.groupEnd();
        
        return {
            total: this.tests.length,
            passed: this.passedTests,
            failed: this.tests.length - this.passedTests
        };
    }
}

/**
 * Run the application test suite
 */
const runApiTests = async () => {
    const tester = new TestRunner();
    
    // Test API connectivity
    tester.addTest('API returns posts', async () => {
        const posts = await api.getPosts();
        if (!Array.isArray(posts) || posts.length === 0) {
            throw new Error('Failed to fetch posts');
        }
    });
    
    // Test comments endpoint
    tester.addTest('API returns comments for a post', async () => {
        const comments = await api.getComments(1);
        if (!Array.isArray(comments) || comments.length === 0) {
            throw new Error('Failed to fetch comments');
        }
    });
    
    // Test API error handling
    tester.addTest('API handles invalid post IDs', async () => {
        try {
            await api.getComments('invalid');
            throw new Error('Should have thrown an error for invalid ID');
        } catch (error) {
            if (!error.message.includes('Invalid post ID')) {
                throw new Error('Incorrect error handling for invalid post ID');
            }
        }
    });
    
    // Test UI utilities
    tester.addTest('UI.sanitizeHTML prevents XSS', () => {
        const malicious = '<script>alert("XSS")</script>';
        const sanitized = UI.sanitizeHTML(malicious);
        if (sanitized.includes('<script>')) {
            throw new Error('Sanitization failed');
        }
    });
    
    // Test highlighting functionality
    tester.addTest('UI.highlightText properly highlights keywords', () => {
        const text = 'This contains rerum and more text';
        const highlighted = UI.highlightText(text, 'rerum');
        if (!highlighted.includes('<span class="highlight">rerum</span>')) {
            throw new Error('Highlighting failed');
        }
    });
    
    // Test RegExp escaping
    tester.addTest('UI.escapeRegExp escapes special characters', () => {
        const specialChars = '.*+?^${}()|[]\\';
        const escaped = UI.escapeRegExp(specialChars);
        if (escaped !== '\\.\\*\\+\\?\\^\\$\\{\\}\$$\$$\\|\$$\$$\\\\') {
            throw new Error('RegExp escaping failed');
        }
    });
    
    // Test pagination creation
    tester.addTest('UI.createPagination creates correct pagination element', () => {
        let pageChanged = false;
        const pagination = UI.createPagination(2, 5, () => { pageChanged = true; });
        
        if (!pagination || pagination.tagName !== 'NAV') {
            throw new Error('Pagination element not created correctly');
        }
        
        const pages = pagination.querySelectorAll('.page-item');
        if (pages.length < 5) {
            throw new Error('Not enough page items created');
        }
        
        // Find active page
        const activePage = pagination.querySelector('.page-item.active');
        if (!activePage || activePage.textContent.trim() !== '2') {
            throw new Error('Active page not set correctly');
        }
    });
    
    // Run all tests
    return await tester.runTests();
};

// Run tests if in test mode
if (window.location.search.includes('test=true')) {
    document.addEventListener('DOMContentLoaded', async () => {
        // Create test UI
        const container = document.createElement('div');
        container.className = 'container mt-4';
        
        const header = document.createElement('h1');
        header.textContent = 'Running Tests...';
        
        const results = document.createElement('pre');
        results.className = 'mt-3 p-3 border bg-light';
        
        container.appendChild(header);
        container.appendChild(results);
        
        document.body.appendChild(container);
        
        // Run tests and show results
        try {
            const testResults = await runApiTests();
            header.textContent = `Tests: ${testResults.passed}/${testResults.total} passed`;
            
            if (testResults.failed > 0) {
                header.className = 'text-danger';
            } else {
                header.className = 'text-success';
            }
            
            // Add detailed test output from console
            results.textContent = 'See browser console for detailed test results';
        } catch (error) {
            header.textContent = 'Test Runner Error';
            header.className = 'text-danger';
            results.textContent = error.message;
        }
    });
}