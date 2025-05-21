/**
 * Reports page functionality
 */
document.addEventListener('DOMContentLoaded', async () => {
    // DOM elements
    const rerumCountElement = document.getElementById('rerum-count');
    const userPostsTable = document.getElementById('user-posts-table');
    const reportsContent = document.getElementById('reports-content');
    const errorContainer = document.getElementById('error-container');
    const loadingElement = document.getElementById('loading');
    const sortByIdBtn = document.getElementById('sort-by-id');
    const sortByCountBtn = document.getElementById('sort-by-count');
    const sortByRerumBtn = document.getElementById('sort-by-rerum');
    
    // Constants
    const RERUM_KEYWORD = 'rerum';
    
    // State
    let userStats = [];
    let sortOrder = 'id'; // 'id', 'count', or 'rerum'
    
    /**
     * Show/hide elements by toggling classes
     */
    const toggleElement = (element, show) => {
        if (show) {
            element.classList.remove('d-none');
        } else {
            element.classList.add('d-none');
        }
    };
    
    /**
     * Show error message
     */
    const showError = (message) => {
        errorContainer.textContent = message;
        toggleElement(errorContainer, true);
        toggleElement(reportsContent, false);
    };
    
    /**
     * Load all report data from the API
     */
    const loadReports = async () => {
        try {
            toggleElement(loadingElement, true);
            toggleElement(errorContainer, false);
            toggleElement(reportsContent, false);
            
            // Fetch posts from API
            const posts = await api.getPosts();
            
            // Report 1: Count posts containing "rerum"
            const rerumPosts = posts.filter(post => 
                post.body.toLowerCase().includes(RERUM_KEYWORD)
            );
            
            // Report 2: Analyze posts by user
            userStats = analyzePostsByUser(posts, RERUM_KEYWORD);
            
            // Render reports
            renderRerumCount(rerumPosts.length);
            renderUserPostStats();
            
            // Show reports content
            toggleElement(loadingElement, false);
            toggleElement(reportsContent, true);
        } catch (error) {
            toggleElement(loadingElement, false);
            showError(`Failed to load report data: ${error.message}`);
            console.error('Error loading reports:', error);
        }
    };
    
    /**
     * Analyze posts by user, counting total posts and posts with keyword
     * @param {Array} posts - Array of posts
     * @param {string} keyword - Keyword to search for
     * @returns {Array} - Array of user stats objects
     */
    const analyzePostsByUser = (posts, keyword) => {
        const userStatsMap = {};
        
        // First pass: Count total posts and initialize rerum counts
        posts.forEach(post => {
            const userId = post.userId;
            
            if (!userStatsMap[userId]) {
                userStatsMap[userId] = {
                    userId,
                    totalPosts: 0,
                    rerumPosts: 0
                };
            }
            
            userStatsMap[userId].totalPosts++;
            
            // Check if post contains the keyword
            if (post.body.toLowerCase().includes(keyword)) {
                userStatsMap[userId].rerumPosts++;
            }
        });
        
        // Convert to array for easier sorting
        return Object.values(userStatsMap);
    };
    
    /**
     * Render "rerum" count
     * @param {number} count - Number of posts containing "rerum"
     */
    const renderRerumCount = (count) => {
        rerumCountElement.textContent = count;
        
        // Add a color indicator based on count
        rerumCountElement.className = 'display-1 mb-2';
        if (count > 10) {
            rerumCountElement.classList.add('text-success');
        } else if (count > 5) {
            rerumCountElement.classList.add('text-warning');
        } else {
            rerumCountElement.classList.add('text-danger');
        }
    };
    
    /**
     * Get appropriate badge class based on post count
     * @param {number} count - Post count
     * @returns {string} - Bootstrap badge class
     */
    const getBadgeClass = (count) => {
        if (count >= 10) return 'bg-success';
        if (count >= 5) return 'bg-warning text-dark';
        if (count > 0) return 'bg-danger';
        return 'bg-secondary';
    };
    
    /**
     * Render user post statistics
     */
    const renderUserPostStats = () => {
        userPostsTable.innerHTML = '';
        
        if (userStats.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.textContent = 'No data available';
            cell.colSpan = 3;
            cell.className = 'text-center';
            row.appendChild(cell);
            userPostsTable.appendChild(row);
            return;
        }
        
        // Sort user stats based on current sort order
        const sortedStats = [...userStats].sort((a, b) => {
            if (sortOrder === 'id') {
                return a.userId - b.userId;
            } else if (sortOrder === 'count') {
                return b.totalPosts - a.totalPosts;
            } else if (sortOrder === 'rerum') {
                return b.rerumPosts - a.rerumPosts || b.totalPosts - a.totalPosts;
            }
            return 0;
        });
        
        // Render each row
        sortedStats.forEach(stat => {
            const row = document.createElement('tr');
            
            // User ID cell
            const userIdCell = document.createElement('td');
            userIdCell.textContent = stat.userId;
            
            // Total posts cell
            const totalCell = document.createElement('td');
            const totalBadge = document.createElement('span');
            totalBadge.className = `badge ${getBadgeClass(stat.totalPosts)}`;
            totalBadge.textContent = stat.totalPosts;
            totalCell.appendChild(totalBadge);
            
            // Rerum posts cell
            const rerumCell = document.createElement('td');
            const rerumBadge = document.createElement('span');
            rerumBadge.className = `badge ${getBadgeClass(stat.rerumPosts)}`;
            rerumBadge.textContent = stat.rerumPosts;
            
            // Add percentage if there are rerum posts
            if (stat.rerumPosts > 0) {
                const percentage = Math.round((stat.rerumPosts / stat.totalPosts) * 100);
                const percentSpan = document.createElement('span');
                percentSpan.className = 'ms-2 small text-muted';
                percentSpan.textContent = `(${percentage}%)`;
                rerumCell.appendChild(rerumBadge);
                rerumCell.appendChild(percentSpan);
            } else {
                rerumCell.appendChild(rerumBadge);
            }
            
            // Append cells to row
            row.appendChild(userIdCell);
            row.appendChild(totalCell);
            row.appendChild(rerumCell);
            
            // Highlight row if user has rerum posts
            if (stat.rerumPosts > 0) {
                row.classList.add('rerum-highlight');
            }
            
            userPostsTable.appendChild(row);
        });
    };
    
    // Add event listeners for sorting
    sortByIdBtn.addEventListener('click', () => {
        sortByIdBtn.classList.add('active');
        sortByCountBtn.classList.remove('active');
        sortByRerumBtn.classList.remove('active');
        sortOrder = 'id';
        renderUserPostStats();
    });
    
    sortByCountBtn.addEventListener('click', () => {
        sortByIdBtn.classList.remove('active');
        sortByCountBtn.classList.add('active');
        sortByRerumBtn.classList.remove('active');
        sortOrder = 'count';
        renderUserPostStats();
    });
    
    sortByRerumBtn.addEventListener('click', () => {
        sortByIdBtn.classList.remove('active');
        sortByCountBtn.classList.remove('active');
        sortByRerumBtn.classList.add('active');
        sortOrder = 'rerum';
        renderUserPostStats();
    });
    
    // Load reports data
    await loadReports();
});