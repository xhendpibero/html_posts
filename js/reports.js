/**
 * Reports page functionality
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Cache DOM elements
    const elements = {
        rerumCount: document.getElementById('rerum-count'),
        userPostsTable: document.getElementById('user-posts-table'),
        reportsContent: document.getElementById('reports-content'),
        errorContainer: document.getElementById('error-container'),
        loading: document.getElementById('loading'),
        sortButtons: {
            id: document.getElementById('sort-by-id'),
            count: document.getElementById('sort-by-count'),
            rerum: document.getElementById('sort-by-rerum')
        }
    };
    
    // Constants
    const RERUM_KEYWORD = 'rerum';
    
    // State
    let userStats = [];
    let sortOrder = 'id'; // 'id', 'count', or 'rerum'
    
    /**
     * Show/hide elements by toggling classes
     */
    const toggleElement = (element, show) => {
        element.classList.toggle('d-none', !show);
    };
    
    /**
     * Show error message
     */
    const showError = (message) => {
        elements.errorContainer.textContent = message;
        toggleElement(elements.errorContainer, true);
        toggleElement(elements.reportsContent, false);
    };
    
    /**
     * Process all posts data in a single pass
     * @param {Array} posts - Array of posts
     * @param {string} keyword - Keyword to search for
     * @returns {Object} - Object containing rerum posts count and user stats
     */
    const processAllPostsData = (posts, keyword) => {
        let rerumPostsCount = 0;
        const userStatsMap = {};
        
        posts.forEach(post => {
            // Process user stats
            const userId = post.userId;
            
            if (!userStatsMap[userId]) {
                userStatsMap[userId] = {
                    userId,
                    totalPosts: 0,
                    rerumPosts: 0
                };
            }
            
            userStatsMap[userId].totalPosts++;
            
            // Check if post contains the keyword - do this only once
            // will updated this line if condition more than 1 reports
            const containsRerum = post.body.toLowerCase().includes(keyword);
            if (containsRerum) {
                rerumPostsCount++;
                userStatsMap[userId].rerumPosts++;
            }
        });
        
        return {
            rerumPostsCount,
            userStatsData: Object.values(userStatsMap),
            // report 1,
            // report 2,
            // report 3,
            // report 4,
        };
    };
    
    /**
     * Load all report data from the API
     */
    const loadReports = async () => {
        try {
            toggleElement(elements.loading, true);
            toggleElement(elements.errorContainer, false);
            toggleElement(elements.reportsContent, false);
            
            // Fetch posts from API
            const posts = await api.getPosts();
            
            // Process all posts data in a single pass
            const { rerumPostsCount, userStatsData } = processAllPostsData(posts, RERUM_KEYWORD);
            userStats = userStatsData;
            
            // Render reports
            renderRerumCount(rerumPostsCount);
            renderUserPostStats();
            
            // Show reports content
            toggleElement(elements.loading, false);
            toggleElement(elements.reportsContent, true);
        } catch (error) {
            toggleElement(elements.loading, false);
            showError(`Failed to load report data: ${error.message}`);
            console.error('Error loading reports:', error);
        }
    };
    
    /**
     * Render "rerum" count
     * @param {number} count - Number of posts containing "rerum"
     */
    const renderRerumCount = (count) => {
        elements.rerumCount.textContent = count;
        
        // Add a color indicator based on count
        elements.rerumCount.className = 'display-1 mb-2';
        if (count > 10) {
            elements.rerumCount.classList.add('text-success');
        } else if (count > 5) {
            elements.rerumCount.classList.add('text-warning');
        } else {
            elements.rerumCount.classList.add('text-danger');
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
     * Get sorted stats based on current sort order
     * @returns {Array} - Sorted user stats
     */
    const getSortedStats = () => {
        const sortFunctions = {
            'id': (a, b) => a.userId - b.userId,
            'count': (a, b) => b.totalPosts - a.totalPosts,
            'rerum': (a, b) => b.rerumPosts - a.rerumPosts || b.totalPosts - a.totalPosts
        };
        
        return [...userStats].sort(sortFunctions[sortOrder] || sortFunctions.id);
    };
    
    /**
     * Create a table row for user stats
     * @param {Object} stat - User stat object
     * @returns {HTMLElement} - Table row element
     */
    const createUserStatsRow = (stat) => {
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
        rerumCell.appendChild(rerumBadge);
        
        // Add percentage if there are rerum posts
        if (stat.rerumPosts > 0) {
            const percentage = Math.round((stat.rerumPosts / stat.totalPosts) * 100);
            const percentSpan = document.createElement('span');
            percentSpan.className = 'ms-2 small text-muted';
            percentSpan.textContent = `(${percentage}%)`;
            rerumCell.appendChild(percentSpan);
        }
        
        // Append cells to row
        row.appendChild(userIdCell);
        row.appendChild(totalCell);
        row.appendChild(rerumCell);
        
        // Highlight row if user has rerum posts
        if (stat.rerumPosts > 0) {
            row.classList.add('rerum-highlight');
        }
        
        return row;
    };
    
    /**
     * Render user post statistics
     */
    const renderUserPostStats = () => {
        elements.userPostsTable.innerHTML = '';
        
        if (userStats.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.textContent = 'No data available';
            cell.colSpan = 3;
            cell.className = 'text-center';
            row.appendChild(cell);
            elements.userPostsTable.appendChild(row);
            return;
        }
        
        // Create a document fragment to batch DOM operations
        const fragment = document.createDocumentFragment();
        
        // Sort and render
        getSortedStats().forEach(stat => {
            const row = createUserStatsRow(stat);
            fragment.appendChild(row);
        });
        
        // Append all rows at once
        elements.userPostsTable.appendChild(fragment);
    };
    
    /**
     * Update sort order and UI
     * @param {string} newSortOrder - New sort order
     */
    const updateSortOrder = (newSortOrder) => {
        sortOrder = newSortOrder;
        
        // Update active button state
        Object.values(elements.sortButtons).forEach(btn => {
            btn.classList.remove('active');
        });
        
        elements.sortButtons[newSortOrder].classList.add('active');
        renderUserPostStats();
    };
    
    // Add event listeners for sorting
    elements.sortButtons.id.addEventListener('click', () => updateSortOrder('id'));
    elements.sortButtons.count.addEventListener('click', () => updateSortOrder('count'));
    elements.sortButtons.rerum.addEventListener('click', () => updateSortOrder('rerum'));
    
    // Load reports data
    await loadReports();
});