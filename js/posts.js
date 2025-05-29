/**
 * Posts page functionality - Refactored for performance and maintainability
 */
document.addEventListener("DOMContentLoaded", async () => {
  // Constants
  const ITEMS_PER_PAGE = 10;
  const KEYWORD_HIGHLIGHT = "rerum";

  // State
  const state = {
    allPosts: [],
    filteredPosts: [],
    currentPage: 1,
    selectedPostId: null,
  };

  // DOM Elements Cache - centralized for better performance
  const elements = {
    // Main elements
    searchInput: document.getElementById("search-input"),
    searchBtn: document.getElementById("search-btn"),
    postsTableBody: document.getElementById("posts-table-body"),
    paginationControls: document.getElementById("pagination-controls"),

    // Modals
    modals: {
      comments: {
        element: document.getElementById("commentsModal"),
        instance: null,
        postIdElement: document.getElementById("modal-post-id"),
        commentsContainer: document.getElementById("comments-container"),
      },
      viewDetails: {
        element: document.getElementById("viewDetailsModal"),
        instance: null,
        postId: document.getElementById("view-post-id"),
        postIdBadge: document.getElementById("view-post-id-badge"),
        userId: document.getElementById("view-post-user-id"),
        title: document.getElementById("view-post-title"),
        body: document.getElementById("view-post-body"),
      },
      editPost: {
        element: document.getElementById("editPostModal"),
        instance: null,
        postId: document.getElementById("edit-post-id"),
        title: document.getElementById("edit-title"),
        body: document.getElementById("edit-body"),
        successMessage: document.getElementById("edit-success-message"),
        saveBtn: document.getElementById("save-edit-btn"),
      },
      deleteConfirm: {
        element: document.getElementById("deleteConfirmModal"),
        instance: null,
        postId: document.getElementById("delete-post-id"),
        successMessage: document.getElementById("delete-success-message"),
        confirmBtn: document.getElementById("confirm-delete-btn"),
      },
    },

    // Modal buttons
    buttons: {
      viewComments: document.getElementById("view-comments-btn"),
      viewEdit: document.getElementById("view-edit-btn"),
      viewDelete: document.getElementById("view-delete-btn"),
    },
  };

  // Initialize all Bootstrap modals
  const initModals = () => {
    // Create modal instances
    Object.values(elements.modals).forEach((modal) => {
      if (modal.element) {
        modal.instance = new bootstrap.Modal(modal.element);
      }
    });
  };

  // Setup all modal event listeners
  const setupModalEvents = () => {
    // View comments button in details modal
    if (elements.buttons.viewComments) {
      elements.buttons.viewComments.addEventListener("click", () => {
        const postId = elements.modals.viewDetails.postId.textContent;
        elements.modals.viewDetails.instance.hide();
        loadComments(postId);
      });
    }

    // Edit button in details modal
    if (elements.buttons.viewEdit) {
      elements.buttons.viewEdit.addEventListener("click", () => {
        const postId = elements.modals.viewDetails.postId.textContent;
        const post = findPostById(postId);
        if (post) {
          elements.modals.viewDetails.instance.hide();
          showEditPostModal(post);
        }
      });
    }

    // Delete button in details modal
    if (elements.buttons.viewDelete) {
      elements.buttons.viewDelete.addEventListener("click", () => {
        const postId = elements.modals.viewDetails.postId.textContent;
        const post = findPostById(postId);
        if (post) {
          elements.modals.viewDetails.instance.hide();
          showDeleteConfirmation(post);
        }
      });
    }

    // Save edit button
    if (elements.modals.editPost.saveBtn) {
      elements.modals.editPost.saveBtn.addEventListener("click", savePostEdit);
    }

    // Confirm delete button
    if (elements.modals.deleteConfirm.confirmBtn) {
      elements.modals.deleteConfirm.confirmBtn.addEventListener(
        "click",
        confirmPostDelete
      );
    }
  };

  /**
   * Find a post by its ID
   * @param {string|number} postId - The post ID to find
   * @returns {Object|null} - The found post or null
   */
  const findPostById = (postId) => {
    return state.allPosts.find((p) => p.id.toString() === postId.toString());
  };

  /**
   * Show post details in modal
   * @param {Object} post - Post object
   */
  const showPostDetails = (post) => {
    const modal = elements.modals.viewDetails;

    modal.postId.textContent = post.id;
    modal.postIdBadge.textContent = post.id;
    modal.userId.textContent = post.userId;
    modal.title.textContent = post.title;
    modal.body.innerHTML = UI.highlightText(
      UI.sanitizeHTML(post.body),
      KEYWORD_HIGHLIGHT
    );

    modal.instance.show();
  };

  /**
   * Show edit post modal
   * @param {Object} post - Post object
   */
  const showEditPostModal = (post) => {
    const modal = elements.modals.editPost;

    modal.postId.textContent = post.id;
    modal.title.value = post.title;
    modal.body.value = post.body;
    modal.successMessage.classList.add("d-none");

    modal.instance.show();
  };

  /**
   * Save post edits
   */
  const savePostEdit = () => {
    const modal = elements.modals.editPost;
    const postId = modal.postId.textContent;
    const title = modal.title.value.trim();
    const body = modal.body.value.trim();

    // Basic validation
    if (!title || !body) {
      alert("Please fill in all fields");
      return;
    }

    // Update post in our local data
    updatePost(postId, { title, body });

    // Show success message
    modal.successMessage.classList.remove("d-none");

    // Auto-hide the success message after 3 seconds
    setTimeout(() => {
      modal.successMessage.classList.add("d-none");
      modal.instance.hide();
    }, 3000);
  };

  /**
   * Update a post in both allPosts and filteredPosts arrays
   * @param {string|number} postId - The post ID to update
   * @param {Object} updates - Object with updated properties
   */
  const updatePost = (postId, updates) => {
    // Update in allPosts
    const postIndex = state.allPosts.findIndex(
      (p) => p.id.toString() === postId.toString()
    );
    if (postIndex !== -1) {
      state.allPosts[postIndex] = { ...state.allPosts[postIndex], ...updates };

      // Update in filteredPosts if present
      const filteredIndex = state.filteredPosts.findIndex(
        (p) => p.id.toString() === postId.toString()
      );
      if (filteredIndex !== -1) {
        state.filteredPosts[filteredIndex] = {
          ...state.filteredPosts[filteredIndex],
          ...updates,
        };
      }

      // Re-render current page
      renderPaginatedPosts();
    }
  };

  /**
   * Show delete confirmation modal
   * @param {Object} post - Post object
   */
  const showDeleteConfirmation = (post) => {
    const modal = elements.modals.deleteConfirm;

    modal.postId.textContent = post.id;
    modal.successMessage.classList.add("d-none");
    modal.confirmBtn.disabled = false;

    modal.instance.show();
  };

  /**
   * Confirm post deletion
   */
  const confirmPostDelete = () => {
    const modal = elements.modals.deleteConfirm;
    const postId = modal.postId.textContent;

    // Delete post from arrays
    deletePost(postId);

    // Show success message
    modal.successMessage.classList.remove("d-none");
    modal.confirmBtn.disabled = true;

    // Auto-hide the success message after 3 seconds
    setTimeout(() => {
      modal.successMessage.classList.add("d-none");
      modal.confirmBtn.disabled = false;
      modal.instance.hide();
    }, 3000);
  };

  /**
   * Delete a post from both allPosts and filteredPosts arrays
   * @param {string|number} postId - The post ID to delete
   */
  const deletePost = (postId) => {
    // Remove from allPosts
    const postIndex = state.allPosts.findIndex(
      (p) => p.id.toString() === postId.toString()
    );
    if (postIndex !== -1) {
      state.allPosts.splice(postIndex, 1);

      // Remove from filteredPosts if present
      const filteredIndex = state.filteredPosts.findIndex(
        (p) => p.id.toString() === postId.toString()
      );
      if (filteredIndex !== -1) {
        state.filteredPosts.splice(filteredIndex, 1);
      }

      // Re-render current page
      renderPaginatedPosts();
    }
  };

  /**
   * Load all posts from the API
   */
  const loadPosts = async () => {
    try {
      UI.hideError();
      UI.toggleLoading(true);
      state.allPosts = await api.getPosts();
      state.filteredPosts = [...state.allPosts];
      renderPaginatedPosts();
    } catch (error) {
      UI.showError(`Failed to load posts: ${error.message}`);
      console.error(error);
    } finally {
      UI.toggleLoading(false);
    }
  };

  /**
   * Render posts for the current page with pagination
   */
  const renderPaginatedPosts = () => {
    const totalPages = Math.ceil(state.filteredPosts.length / ITEMS_PER_PAGE);
    state.currentPage = Math.min(state.currentPage, totalPages || 1);

    const startIndex = (state.currentPage - 1) * ITEMS_PER_PAGE;
    const postsToShow = state.filteredPosts.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );

    renderPosts(postsToShow);
    UI.initTooltips();
    renderPagination(totalPages);
  };

  /**
   * Render pagination controls
   * @param {number} totalPages - Total number of pages
   */
  const renderPagination = (totalPages) => {
    elements.paginationControls.innerHTML = "";

    if (totalPages <= 1) {
      return;
    }

    const pagination = UI.createPagination(
      state.currentPage,
      totalPages,
      (page) => {
        state.currentPage = page;
        renderPaginatedPosts();
        window.scrollTo(0, 0);
      }
    );

    elements.paginationControls.appendChild(pagination);
  };

  /**
   * Render posts in the table
   * @param {Array} posts - Posts to render
   */
  const renderPosts = (posts) => {
    // Use document fragment for better performance
    const fragment = document.createDocumentFragment();

    if (posts.length === 0) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.textContent = "No posts found";
      cell.colSpan = 5;
      cell.className = "text-center py-4";
      row.appendChild(cell);
      fragment.appendChild(row);
    } else {
      posts.forEach((post) => {
        fragment.appendChild(createPostRow(post));
      });
    }

    // Replace all content at once for better performance
    elements.postsTableBody.innerHTML = "";
    elements.postsTableBody.appendChild(fragment);
  };

  /**
   * Create a table row for a post
   * @param {Object} post - The post object
   * @returns {HTMLElement} - The created row element
   */
  const createPostRow = (post) => {
    const row = document.createElement("tr");

    // Check if post body contains "rerum"
    const containsRerum = post.body.toLowerCase().includes(KEYWORD_HIGHLIGHT);
    if (containsRerum) {
      row.classList.add("rerum-highlight");
    }

    // Create cells using the UI helper
    const idCell = UI.createElement("td", {}, post.id.toString());
    const userIdCell = UI.createElement("td", {}, post.userId.toString());

    // Title cell
    const titleCell = UI.createElement("td", {
      title: post.title,
    });
    titleCell.textContent = UI.truncateText(post.title, 60);

    // Body cell with tooltip
    const bodyCell = UI.createElement("td", {
      class: "post-body custom-tooltip",
    });

    // Properly sanitize content before inserting HTML
    const sanitizedBody = UI.sanitizeHTML(post.body);
    const truncatedBody = UI.truncateText(sanitizedBody, 80);
    bodyCell.innerHTML = UI.highlightText(truncatedBody, KEYWORD_HIGHLIGHT);

    // Add tooltip content for body
    const bodyTooltip = UI.createElement("div", {
      class: "tooltip-content",
    });
    bodyTooltip.innerHTML = UI.highlightText(sanitizedBody, KEYWORD_HIGHLIGHT);
    bodyCell.appendChild(bodyTooltip);

    // Actions cell with multiple buttons
    const actionsCell = UI.createElement("td", {});

    // Create and append action buttons
    const actionButtons = createActionButtons(post);
    actionButtons.forEach((button) => actionsCell.appendChild(button));

    // Append cells to row
    row.appendChild(idCell);
    row.appendChild(userIdCell);
    row.appendChild(titleCell);
    row.appendChild(bodyCell);
    row.appendChild(actionsCell);

    return row;
  };

  /**
   * Create action buttons for a post
   * @param {Object} post - The post object
   * @returns {Array} - Array of button elements
   */
  const createActionButtons = (post) => {
    // Define button configurations
    const buttonConfigs = [
      {
        type: "comments",
        class: "btn-info",
        icon: "bi-chat-dots-fill",
        tooltip: "View Comments",
        handler: () => loadComments(post.id),
      },
      {
        type: "details",
        class: "btn-primary",
        icon: "bi-eye-fill",
        tooltip: "View Details",
        handler: () => showPostDetails(post),
      },
      {
        type: "edit",
        class: "btn-warning",
        icon: "bi-pencil-fill",
        tooltip: "Edit Post",
        handler: () => showEditPostModal(post),
      },
      {
        type: "delete",
        class: "btn-danger",
        icon: "bi-trash-fill",
        tooltip: "Delete Post",
        handler: () => showDeleteConfirmation(post),
      },
    ];

    // Create buttons based on configurations
    return buttonConfigs.map((config) => {
      const button = UI.createElement("button", {
        class: `btn ${config.class} btn-action action-tooltip`,
        "data-post-id": post.id,
        "data-action-type": config.type,
      });

      button.innerHTML = `<i class="bi ${config.icon}"></i>`;

      const tooltipSpan = UI.createElement(
        "span",
        { class: "action-tooltip-text" },
        config.tooltip
      );

      button.appendChild(tooltipSpan);
      button.addEventListener("click", config.handler);

      return button;
    });
  };

  /**
   * Load comments for a specific post
   * @param {number} postId - ID of the post
   */
  const loadComments = async (postId) => {
    const modal = elements.modals.comments;

    try {
      modal.postIdElement.textContent = postId;
      modal.commentsContainer.innerHTML =
        '<div class="text-center"><div class="spinner-border"></div></div>';

      // Show the modal first for better UX
      modal.instance.show();

      // Fetch comments after modal is visible
      setTimeout(async () => {
        try {
          const comments = await api.getComments(postId);
          renderComments(comments, modal.commentsContainer);
        } catch (error) {
          modal.commentsContainer.innerHTML =
            '<div class="alert alert-danger">Failed to load comments</div>';
          console.error("Error loading comments:", error);
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
    // Use document fragment for better performance
    const fragment = document.createDocumentFragment();

    if (!comments || comments.length === 0) {
      const noCommentsEl = UI.createElement(
        "p",
        { class: "text-center" },
        "No comments found"
      );
      fragment.appendChild(noCommentsEl);
    } else {
      comments.forEach((comment) => {
        fragment.appendChild(createCommentElement(comment));
      });
    }

    // Replace all content at once
    container.innerHTML = "";
    container.appendChild(fragment);
  };

  /**
   * Create a comment element
   * @param {Object} comment - The comment object
   * @returns {HTMLElement} - The created comment element
   */
  const createCommentElement = (comment) => {
    const commentElement = UI.createElement("div", {
      class: "card mb-2",
    });

    const commentBody = UI.createElement("div", {
      class: "card-body",
    });

    const commentTitle = UI.createElement(
      "h5",
      { class: "card-title" },
      UI.sanitizeHTML(comment.name)
    );

    const commentEmail = UI.createElement(
      "h6",
      { class: "card-subtitle mb-2 text-muted" },
      UI.sanitizeHTML(comment.email)
    );

    const commentText = UI.createElement(
      "p",
      { class: "card-text" },
      UI.sanitizeHTML(comment.body)
    );

    commentBody.appendChild(commentTitle);
    commentBody.appendChild(commentEmail);
    commentBody.appendChild(commentText);
    commentElement.appendChild(commentBody);

    return commentElement;
  };

  /**
   * Filter posts based on search term
   */
  const filterPosts = () => {
    const searchTerm = elements.searchInput.value.trim().toLowerCase();

    // Validate input - limit length and disallow certain characters
    if (searchTerm.length > 100) {
      UI.showError("Search term is too long (max 100 characters)");
      return;
    }

    if (/[<>]/.test(searchTerm)) {
      UI.showError("Search term contains invalid characters");
      return;
    }

    UI.hideError();

    if (!searchTerm) {
      state.filteredPosts = [...state.allPosts];
    } else {
      state.filteredPosts = state.allPosts.filter(
        (post) =>
          post.title.toLowerCase().includes(searchTerm) ||
          post.body.toLowerCase().includes(searchTerm)
      );
    }

    state.currentPage = 1; // Reset to first page on new search
    renderPaginatedPosts();
  };

  /**
   * Initialize the application
   */
  const init = async () => {
    // Initialize Bootstrap modals
    initModals();

    // Set up event listeners for modals
    setupModalEvents();

    // Set up search functionality
    elements.searchBtn.addEventListener("click", filterPosts);

    elements.searchInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") {
        filterPosts();
      }
    });

    // Debounced search for better performance
    const debouncedFilter = UI.debounce(() => {
      const searchLength = elements.searchInput.value.trim().length;
      if (searchLength >= 3 || searchLength === 0) {
        filterPosts();
      }
    }, 500);

    elements.searchInput.addEventListener("input", debouncedFilter);

    // Load posts data
    await loadPosts();
  };

  // Start the application
  init();
});
