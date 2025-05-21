/**
 * Reports page functionality
 */
document.addEventListener('DOMContentLoaded', async () => {
    // DOM elements
    const rerumCountElement = document.getElementById('rerum-count');
    const userPostsTable = document.getElementById('user-posts-table');
    const reportsContent = document.getElementById('reports-content');
    const errorContainer = document.getElementById('error-container');
    
    /**
     * Load all report data from the API
     */
    const loadReports = async () => {
        try {
            UI.toggleLoading(true);
            errorContainer.style.display = 'none';
            
            const posts = await api.getPosts();
            
            // Report 1: Count posts containing "rerum"
            const rerumPosts = posts.filter(post => 
                post.body.toLowerCase().includes('rerum')
            );
            
            // Report 2: Count posts by user
            const userPostCounts = countPostsByUser(posts);
            
            // Render reports
            renderRerumCount(rerumPosts.length);
            renderUserPostCounts(userPostCounts);
            
            // Show reports content
            reportsContent.style.display = 'block';
        } catch (error) {
            showError(`Failed to load report data: ${error.message}`);
            console.error('Error loading reports:', error);
        } finally {
            UI.toggleLoading(false);
        }
    };
    
    /**
     * Count posts by user
     * @param {Array} posts - Array of posts
     * @returns {Object} - Object with user IDs as keys and post counts as values
     */
    const countPostsByUser = (posts) => {
        const userPostCounts = {};
        
        posts.forEach(post => {
            const userId = post.userId;
            userPostCounts[userId] = (userPostCounts[userId] || 0) + 1;
        });
        
        return userPostCounts;
    };
    
    /**
     * Render "rerum" count
     * @param {number} count - Number of posts containing "rerum"
     */
    const renderRerumCount = (count) => {
        rerumCountElement.textContent = count;
        
        // Add a color indicator based on count
        if (count > 10) {
            rerumCountElement.classList.add('text-success');
        } else if (count > 5) {
            rerumCountElement.classList.add('text-warning');
        } else {
            rerumCountElement.classList.add('text-danger');
        }
    };
    
    /**
     * Render user post counts
     * @param {Object} userPostCounts - Object with user IDs as keys and post counts as values
     */
    const renderUserPostCounts = (userPostCounts) => {
        userPostsTable.innerHTML = '';
        
        if (Object.keys(userPostCounts).length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.textContent = 'No data available';
            cell.colSpan = 2;
            cell.className = 'text-center';
            row.appendChild(cell);
            userPostsTable.appendChild(row);
            return;
        }
        
        // Sort by user ID
        const sortedUserIds = Object.keys(userPostCounts).sort((a, b) => parseInt(a) - parseInt(b));
        
        // Render each row
        sortedUserIds.forEach(userId => {
            const row = UI.createElement('tr');
            
            const userIdCell = UI.createElement('td', {}, userId);
            
            const countCell = UI.createElement('td');
            const count = userPostCounts[userId];
            
            // Add badge with appropriate color based on count
            const badge = UI.createElement('span', {
                class: `badge ${getBadgeClass(count)}`
            }, count.toString());
            
            countCell.appendChild(badge);
            
            row.appendChild(userIdCell);
            row.appendChild(countCell);
            userPostsTable.appendChild(row);
        });
    };
    
    /**
     * Get appropriate badge class based on post count
     * @param {number} count - Post count
     * @returns {string} - Bootstrap badge class
     */
    const getBadgeClass = (count) => {
        if (count >= 10) return 'bg-success';
        if (count >= 5) return 'bg-warning text-dark';
        return 'bg-danger';
    };
    
    /**
     * Show error message
     * @param {string} message - Error message
     */
    const showError = (message) => {
        errorContainer.textContent = message;
        errorContainer.style.display = 'block';
        reportsContent.style.display = 'none';
    };
    
    // Load reports data
    await loadReports();
});