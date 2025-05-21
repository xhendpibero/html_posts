/**
 * API service for interacting with JSONPlaceholder
 * @class ApiService
 */
class ApiService {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        this.defaultTimeout = 10000;
    }

    /**
     * Fetch data from the API with timeout and error handling
     * @param {string} endpoint - API endpoint
     * @param {Object} options - Fetch options
     * @returns {Promise<Object>} - Response data
     */
    async fetchData(endpoint, options = {}) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.defaultTimeout);
            
            const requestOptions = {
                ...options,
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    ...(options.headers || {})
                }
            };
            
            const response = await fetch(`${this.baseUrl}${endpoint}`, requestOptions);
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching data:', error);
            if (error.name === 'AbortError') {
                throw new Error('Request timed out');
            }
            throw error;
        }
    }

    /**
     * Get all posts
     * @returns {Promise<Array>} - Array of posts
     */
    async getPosts() {
        return this.fetchData('/posts');
    }

    /**
     * Get comments for a specific post
     * @param {number} postId - ID of the post
     * @returns {Promise<Array>} - Array of comments
     */
    async getComments(postId) {
        if (!postId || isNaN(parseInt(postId))) {
            throw new Error('Invalid post ID');
        }
        return this.fetchData(`/posts/${postId}/comments`);
    }

    /**
     * Get user data
     * @param {number} userId - ID of the user
     * @returns {Promise<Object>} - User data
     */
    async getUser(userId) {
        if (!userId || isNaN(parseInt(userId))) {
            throw new Error('Invalid user ID');
        }
        return this.fetchData(`/users/${userId}`);
    }
}

const api = new ApiService('https://jsonplaceholder.typicode.com');