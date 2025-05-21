/**
 * Posts page functionality
 */
document.addEventListener("DOMContentLoaded", async () => {
  // Constants
  const ITEMS_PER_PAGE = 10;
  const KEYWORD_HIGHLIGHT = "rerum";

  // DOM elements
  const searchInput = document.getElementById("search-input");
  const searchBtn = document.getElementById("search-btn");
  const postsTableBody = document.getElementById("posts-table-body");
  const paginationControls = document.getElementById("pagination-controls");

  // State
  let allPosts = [];
  let filteredPosts = [];
  let currentPage = 1;

  // Bootstrap modal instance
  let commentsModal;

  // Initialize the modal
  const modalElement = document.getElementById("commentsModal");
  if (modalElement) {
    commentsModal = new bootstrap.Modal(modalElement);
  }

  // Initialize all modals
  let viewDetailsModal, editPostModal, deleteConfirmModal;

  // Setup all modals
  const setupModals = () => {
    const viewDetailsElement = document.getElementById("viewDetailsModal");
    const editPostElement = document.getElementById("editPostModal");
    const deleteConfirmElement = document.getElementById("deleteConfirmModal");

    if (viewDetailsElement) {
      viewDetailsModal = new bootstrap.Modal(viewDetailsElement);
    }
    if (editPostElement) {
      editPostModal = new bootstrap.Modal(editPostElement);
    }
    if (deleteConfirmElement) {
      deleteConfirmModal = new bootstrap.Modal(deleteConfirmElement);
    }

    // Set up event listeners for modal actions
    const viewCommentsBtn = document.getElementById("view-comments-btn");
    const viewEditBtn = document.getElementById("view-edit-btn");
    const viewDeleteBtn = document.getElementById("view-delete-btn");
    const saveEditBtn = document.getElementById("save-edit-btn");
    const confirmDeleteBtn = document.getElementById("confirm-delete-btn");

    if (viewCommentsBtn) {
      viewCommentsBtn.addEventListener("click", () => {
        const postId = document.getElementById("view-post-id").textContent;
        viewDetailsModal.hide();
        loadComments(postId);
      });
    }

    if (viewEditBtn) {
      viewEditBtn.addEventListener("click", () => {
        const postId = document.getElementById("view-post-id").textContent;
        const post = allPosts.find((p) => p.id.toString() === postId);
        if (post) {
          viewDetailsModal.hide();
          showEditPostModal(post);
        }
      });
    }

    if (viewDeleteBtn) {
      viewDeleteBtn.addEventListener("click", () => {
        const postId = document.getElementById("view-post-id").textContent;
        const post = allPosts.find((p) => p.id.toString() === postId);
        if (post) {
          viewDetailsModal.hide();
          showDeleteConfirmation(post);
        }
      });
    }

    if (saveEditBtn) {
      saveEditBtn.addEventListener("click", savePostEdit);
    }

    if (confirmDeleteBtn) {
      confirmDeleteBtn.addEventListener("click", confirmPostDelete);
    }
  };

  /**
   * Show post details in modal
   * @param {Object} post - Post object
   */
  const showPostDetails = (post) => {
    document.getElementById("view-post-id").textContent = post.id;
    document.getElementById("view-post-id-badge").textContent = post.id;
    document.getElementById("view-post-user-id").textContent = post.userId;
    document.getElementById("view-post-title").textContent = post.title;

    const postBodyElement = document.getElementById("view-post-body");
    postBodyElement.innerHTML = UI.highlightText(
      UI.sanitizeHTML(post.body),
      KEYWORD_HIGHLIGHT
    );

    viewDetailsModal.show();
  };

  /**
   * Show edit post modal
   * @param {Object} post - Post object
   */
  const showEditPostModal = (post) => {
    document.getElementById("edit-post-id").textContent = post.id;
    document.getElementById("edit-title").value = post.title;
    document.getElementById("edit-body").value = post.body;

    // Hide success message if shown previously
    document.getElementById("edit-success-message").classList.add("d-none");

    editPostModal.show();
  };

  /**
   * Save post edits
   */
  const savePostEdit = () => {
    const postId = document.getElementById("edit-post-id").textContent;
    const title = document.getElementById("edit-title").value.trim();
    const body = document.getElementById("edit-body").value.trim();

    // Basic validation
    if (!title || !body) {
      alert("Please fill in all fields");
      return;
    }

    // Find and update post in our local data
    const postIndex = allPosts.findIndex((p) => p.id.toString() === postId);
    if (postIndex !== -1) {
      allPosts[postIndex].title = title;
      allPosts[postIndex].body = body;

      // Update filtered posts as well
      const filteredIndex = filteredPosts.findIndex(
        (p) => p.id.toString() === postId
      );
      if (filteredIndex !== -1) {
        filteredPosts[filteredIndex].title = title;
        filteredPosts[filteredIndex].body = body;
      }

      // Show success message
      const successMessage = document.getElementById("edit-success-message");
      successMessage.classList.remove("d-none");

      // Re-render current page
      renderPaginatedPosts();

      // Auto-hide the success message after 3 seconds
      setTimeout(() => {
        successMessage.classList.add("d-none");
        editPostModal.hide();
      }, 3000);
    }
  };

  /**
   * Show delete confirmation modal
   * @param {Object} post - Post object
   */
  const showDeleteConfirmation = (post) => {
    document.getElementById("delete-post-id").textContent = post.id;

    // Hide success message if shown previously
    document.getElementById("delete-success-message").classList.add("d-none");

    deleteConfirmModal.show();
  };

  /**
   * Confirm post deletion
   */
  const confirmPostDelete = () => {
    const postId = document.getElementById("delete-post-id").textContent;

    // Find and remove post from our local data
    const postIndex = allPosts.findIndex((p) => p.id.toString() === postId);
    if (postIndex !== -1) {
      allPosts.splice(postIndex, 1);

      // Update filtered posts as well
      const filteredIndex = filteredPosts.findIndex(
        (p) => p.id.toString() === postId
      );
      if (filteredIndex !== -1) {
        filteredPosts.splice(filteredIndex, 1);
      }

      // Show success message
      const successMessage = document.getElementById("delete-success-message");
      successMessage.classList.remove("d-none");

      // Disable delete button
      document.getElementById("confirm-delete-btn").disabled = true;

      // Re-render current page
      renderPaginatedPosts();

      // Auto-hide the success message after 3 seconds
      setTimeout(() => {
        successMessage.classList.add("d-none");
        document.getElementById("confirm-delete-btn").disabled = false;
        deleteConfirmModal.hide();
      }, 3000);
    }
  };

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
    const postsToShow = filteredPosts.slice(
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
    paginationControls.innerHTML = "";

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
   */ const renderPosts = (posts) => {
    postsTableBody.innerHTML = "";

    if (posts.length === 0) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.textContent = "No posts found";
      cell.colSpan = 5;
      cell.className = "text-center py-4";
      row.appendChild(cell);
      postsTableBody.appendChild(row);
      return;
    }

    posts.forEach((post) => {
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
      bodyTooltip.innerHTML = UI.highlightText(
        sanitizedBody,
        KEYWORD_HIGHLIGHT
      );
      bodyCell.appendChild(bodyTooltip);

      // Actions cell with multiple buttons
      const actionsCell = UI.createElement("td", {
        class: "d-flex",
      });

      // Comments button with icon and tooltip
      const viewCommentsBtn = UI.createElement("button", {
        class: "btn btn-info btn-action action-tooltip",
        "data-post-id": post.id,
      });
      viewCommentsBtn.innerHTML = '<i class="bi bi-chat-dots-fill"></i>';

      const commentsBtnTooltip = UI.createElement(
        "span",
        {
          class: "action-tooltip-text",
        },
        "View Comments"
      );
      viewCommentsBtn.appendChild(commentsBtnTooltip);

      viewCommentsBtn.addEventListener("click", () => loadComments(post.id));

      // Edit button with icon and tooltip
      const editBtn = UI.createElement("button", {
        class: "btn btn-warning btn-action action-tooltip",
        "data-post-id": post.id,
      });
      editBtn.innerHTML = '<i class="bi bi-pencil-fill"></i>';

      const editBtnTooltip = UI.createElement(
        "span",
        {
          class: "action-tooltip-text",
        },
        "Edit Post"
      );
      editBtn.appendChild(editBtnTooltip);

      editBtn.addEventListener("click", () => showEditPostModal(post));

      // Delete button with icon and tooltip
      const deleteBtn = UI.createElement("button", {
        class: "btn btn-danger btn-action action-tooltip",
        "data-post-id": post.id,
      });
      deleteBtn.innerHTML = '<i class="bi bi-trash-fill"></i>';

      const deleteBtnTooltip = UI.createElement(
        "span",
        {
          class: "action-tooltip-text",
        },
        "Delete Post"
      );
      deleteBtn.appendChild(deleteBtnTooltip);

      deleteBtn.addEventListener("click", () => showDeleteConfirmation(post));

      // View details button with icon and tooltip
      const viewDetailsBtn = UI.createElement("button", {
        class: "btn btn-primary btn-action action-tooltip",
        "data-post-id": post.id,
      });
      viewDetailsBtn.innerHTML = '<i class="bi bi-eye-fill"></i>';

      const viewDetailsBtnTooltip = UI.createElement(
        "span",
        {
          class: "action-tooltip-text",
        },
        "View Details"
      );
      viewDetailsBtn.appendChild(viewDetailsBtnTooltip);

      viewDetailsBtn.addEventListener("click", () => showPostDetails(post));

      // Append buttons to actions cell
      actionsCell.appendChild(viewCommentsBtn);
      actionsCell.appendChild(viewDetailsBtn);
      actionsCell.appendChild(editBtn);
      actionsCell.appendChild(deleteBtn);

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
      document.getElementById("modal-post-id").textContent = postId;
      const commentsContainer = document.getElementById("comments-container");
      commentsContainer.innerHTML =
        '<div class="text-center"><div class="spinner-border"></div></div>';

      // Show the modal first for better UX
      commentsModal.show();

      // Fetch comments after modal is visible for better perceived performance
      setTimeout(async () => {
        try {
          const comments = await api.getComments(postId);
          renderComments(comments, commentsContainer);
        } catch (error) {
          commentsContainer.innerHTML =
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
    container.innerHTML = "";

    if (!comments || comments.length === 0) {
      container.innerHTML = '<p class="text-center">No comments found</p>';
      return;
    }

    comments.forEach((comment) => {
      const commentElement = UI.createElement("div", {
        class: "card mb-2",
      });

      const commentBody = UI.createElement("div", {
        class: "card-body",
      });

      const commentTitle = UI.createElement(
        "h5",
        {
          class: "card-title",
        },
        UI.sanitizeHTML(comment.name)
      );

      const commentEmail = UI.createElement(
        "h6",
        {
          class: "card-subtitle mb-2 text-muted",
        },
        UI.sanitizeHTML(comment.email)
      );

      const commentText = UI.createElement(
        "p",
        {
          class: "card-text",
        },
        UI.sanitizeHTML(comment.body)
      );

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
      UI.showError("Search term is too long (max 100 characters)");
      return;
    }

    if (/[<>]/.test(searchTerm)) {
      UI.showError("Search term contains invalid characters");
      return;
    }

    UI.hideError();

    if (!searchTerm) {
      filteredPosts = [...allPosts];
    } else {
      filteredPosts = allPosts.filter(
        (post) =>
          post.title.toLowerCase().includes(searchTerm) ||
          post.body.toLowerCase().includes(searchTerm)
      );
    }

    currentPage = 1; // Reset to first page on new search
    renderPaginatedPosts();
  };

  // Event listeners
  searchBtn.addEventListener("click", filterPosts);
  searchInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      filterPosts();
    }
  });

  // Debounced search for input changes
  const debouncedFilter = UI.debounce(() => {
    if (
      searchInput.value.trim().length >= 3 ||
      searchInput.value.trim().length === 0
    ) {
      filterPosts();
    }
  }, 500);

  searchInput.addEventListener("input", debouncedFilter);

  // Initial load
  await loadPosts();
  setupModals();
});
