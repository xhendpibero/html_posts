/**
 * Posts page functionality
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Constants
    const ITEMS_PER_PAGE = 10;
    const KEYWORD_HIGHLIGHT = 'rerum';

    // DOM elements
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const postsTableBody = document.getElementById('posts-table-body');
    const paginationControls = document.getElementById('pagination-controls');
    
    // State
    let allPosts = [];
    let filteredPosts = [];
    let currentPage = 1;
    
    // Bootstrap modal instance
    let commentsModal;

    // Initialize the modal
    const modalElement = document.getElementById('commentsModal');
    if (modalElement) {
        commentsModal = new bootstrap.Modal(modalElement);
    }

    /**
     * Load all posts from the API
     */
    const loadPosts = async () => {
        try {
            UI.hideError();
            UI.toggleLoading(true);
            allPosts = await api.getPosts();
            filteredPosts = [...allPosts];
            renderPaginatedPosts();
        } catch (error) {
            UI.showError(`Failed to load posts: ${error.message}`);
            console.error(error);
        } finally {
            UI.toggleLoading(false);
        }
    };

    /**
     * Render posts for the current page
     */
    const renderPaginatedPosts = () => {
        const totalPages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE);
        currentPage = Math.min(currentPage, totalPages || 1);
        
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const postsToShow = filteredPosts.slice(startIndex, startIndex + ITEMS_PER_PAGE);
        
        renderPosts(postsToShow);
        renderPagination(totalPages);
    };
    /**
     * Render pagination controls
     * @param {number} totalPages - Total number of pages
     */
    const renderPagination = (totalPages) => {
        paginationControls.innerHTML = '';
        
        if (totalPages <= 1) {
            return;
        }
        
        const pagination = UI.createPagination(currentPage, totalPages, (page) => {
            currentPage = page;
            renderPaginatedPosts();
            window.scrollTo(0, 0);
        });
        
        paginationControls.appendChild(pagination);
    };

    /**
     * Render posts in the table
     * @param {Array} posts - Posts to render
     */
    const renderPosts = (posts) => {
        postsTableBody.innerHTML = '';
        
        if (posts.length === 0) {
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.textContent = 'No posts found';
            cell.colSpan = 5;
            cell.className = 'text-center';
            row.appendChild(cell);
            postsTableBody.appendChild(row);
            return;
        }
        
        posts.forEach(post => {
            const row = document.createElement('tr');
            
            // Check if post body contains "rerum"
            const containsRerum = post.body.toLowerCase().includes(KEYWORD_HIGHLIGHT);
            if (containsRerum) {
                row.classList.add('rerum-highlight');
            }
            
            // Create cells using the UI helper
            const idCell = UI.createElement('td', {}, post.id.toString());
            const userIdCell = UI.createElement('td', {}, post.userId.toString());
            
            const titleCell = UI.createElement('td', {
                title: post.title
            });
            titleCell.textContent = UI.truncateText(post.title, 60);
            
            const bodyCell = UI.createElement('td', {
                class: 'post-body',
                title: post.body
            });
            
            // Properly sanitize content before inserting HTML
            const sanitizedBody = UI.sanitizeHTML(post.body);
            bodyCell.innerHTML = UI.highlightText(sanitizedBody, KEYWORD_HIGHLIGHT);
            
            const actionsCell = UI.createElement('td');
            const viewCommentsBtn = UI.createElement('button', {
                class: 'btn btn-sm btn-info',
                'data-post-id': post.id
            }, 'View Comments');
            
            viewCommentsBtn.addEventListener('click', () => loadComments(post.id));
            actionsCell.appendChild(viewCommentsBtn);
            
            // Append cells to row
            row.appendChild(idCell);
            row.appendChild(userIdCell);
            row.appendChild(titleCell);
            row.appendChild(bodyCell);
            row.appendChild(actionsCell);
            
            // Append row to table body
            postsTableBody.appendChild(row);
        });
    };

    /**
     * Load comments for a specific post
     * @param {number} postId - ID of the post
     */
    const loadComments = async (postId) => {
        try {
            document.getElementById('modal-post-id').textContent = postId;
            const commentsContainer = document.getElementById('comments-container');
            commentsContainer.innerHTML = '<div class="text-center"><div class="spinner-border"></div></div>';
            
            // Show the modal first for better UX
            commentsModal.show();
            
            // Fetch comments after modal is visible for better perceived performance
            setTimeout(async () => {
                try {
                    const comments = await api.getComments(postId);
                    renderComments(comments, commentsContainer);
                } catch (error) {
                    commentsContainer.innerHTML = '<div class="alert alert-danger">Failed to load comments</div>';
                    console.error('Error loading comments:', error);
                }
            }, 100);
        } catch (error) {
            UI.showError(`Failed to load comments: ${error.message}`);
            console.error(error);
        }
    };

    /**
     * Render comments in the modal
     * @param {Array} comments - Comments to render
     * @param {HTMLElement} container - Container element
     */
    const renderComments = (comments, container) => {
        container.innerHTML = '';
        
        if (!comments || comments.length === 0) {
            container.innerHTML = '<p class="text-center">No comments found</p>';
            return;
        }
        
        comments.forEach(comment => {
            const commentElement = UI.createElement('div', {
                class: 'card mb-2'
            });
            
            const commentBody = UI.createElement('div', {
                class: 'card-body'
            });
            
            const commentTitle = UI.createElement('h5', {
                class: 'card-title'
            }, UI.sanitizeHTML(comment.name));
            
            const commentEmail = UI.createElement('h6', {
                class: 'card-subtitle mb-2 text-muted'
            }, UI.sanitizeHTML(comment.email));
            
            const commentText = UI.createElement('p', {
                class: 'card-text'
            }, UI.sanitizeHTML(comment.body));
            
            commentBody.appendChild(commentTitle);
            commentBody.appendChild(commentEmail);
            commentBody.appendChild(commentText);
            commentElement.appendChild(commentBody);
            container.appendChild(commentElement);
        });
    };

    /**
     * Filter posts based on search term
     */
    const filterPosts = () => {
        const searchTerm = searchInput.value.trim().toLowerCase();
        
        // Validate input - limit length and disallow certain characters
        if (searchTerm.length > 100) {
            UI.showError('Search term is too long (max 100 characters)');
            return;
        }
        
        if (/[<>]/.test(searchTerm)) {
            UI.showError('Search term contains invalid characters');
            return;
        }
        
        UI.hideError();
        
        if (!searchTerm) {
            filteredPosts = [...allPosts];
        } else {
            filteredPosts = allPosts.filter(post => 
                post.title.toLowerCase().includes(searchTerm) || 
                post.body.toLowerCase().includes(searchTerm)
            );
        }
        
        currentPage = 1; // Reset to first page on new search
        renderPaginatedPosts();
    };

    // Event listeners
    searchBtn.addEventListener('click', filterPosts);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            filterPosts();
        }
    });

    // Debounced search for input changes
    const debouncedFilter = UI.debounce(() => {
        if (searchInput.value.trim().length >= 3 || searchInput.value.trim().length === 0) {
            filterPosts();
        }
    }, 500);
    
    searchInput.addEventListener('input', debouncedFilter);

    // Initial load
    await loadPosts();
});