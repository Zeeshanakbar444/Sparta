/* ============================================================
   SPARTA BOOK PUBLISHING - WordPress Blog API
   
   This file handles all communication with the WordPress REST API.
   
   FUNCTIONS:
   - fetchBlogPosts()      - loads posts on blog.html
   - fetchSinglePost()     - loads one post on blog-single.html
   - fetchPostComments()   - loads comments for a post
   - submitComment()       - posts a new comment to WordPress
   
   📌 API LOCATION: All endpoint URLs are in js/config.js
      Open config.js and set your WordPress site URL there.
   ============================================================ */

/* ============================================================
   0. DUMMY DATA FOR TESTING
   Used when WordPress API is not configured or fails
   ============================================================ */
const DUMMY_POSTS = [
  {
    id: 101,
    date: new Date().toISOString(),
    title: { rendered: "5 Essential Tips for First-Time Authors" },
    excerpt: { rendered: "Embarking on your first publishing journey? Discover the key strategies to ensure your manuscript stands out in a crowded market." },
    content: { rendered: "<p>Publishing your first book is an exhilarating milestone. However, the path from manuscript to marketplace is filled with critical decisions. Here are five essential tips to help you navigate the process:</p><ul><li><strong>Know Your Audience:</strong> Before you even finish writing, identify who your target readers are.</li><li><strong>Invest in Professional Editing:</strong> A polished book is a successful book.</li><li><strong>Design a Captivating Cover:</strong> Your cover is your primary marketing tool.</li><li><strong>Build an Author Platform:</strong> Start connecting with readers early.</li></li><li><strong>Understand Distribution Channels:</strong> Decide between exclusive and wide distribution.</li></ul>" },
    _embedded: {
      'wp:featuredmedia': [{ source_url: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=800&q=80" }],
      'wp:term': [[{ name: "Writing Tips" }]]
    }
  },
  {
    id: 102,
    date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    title: { rendered: "How to Design a Book Cover that Sells" },
    excerpt: { rendered: "They say don't judge a book by its cover, but everyone does. Learn the psychology behind high-converting cover designs." },
    content: { rendered: "<p>Visual appeal is the first point of contact between your book and a potential reader. A great cover needs to accomplish three things: signal the genre, create an emotional connection, and maintain professional quality. Focus on typography that is legible at thumbnail size and images that evoke the mood of your story.</p>" },
    _embedded: {
      'wp:featuredmedia': [{ source_url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80" }],
      'wp:term': [[{ name: "Design" }]]
    }
  },
  {
    id: 103,
    date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    title: { rendered: "The Future of eBook Distribution in 2024" },
    excerpt: { rendered: "Stay ahead of the curve! Explore the emerging platforms and technologies shaping how readers discover and buy eBooks this year." },
    content: { rendered: "<p>The digital publishing landscape is evolving rapidly. From AI-assisted discovery algorithms to the rise of direct-to-consumer sales, 2024 promises to be a transformative year for independent authors. Subscription models continue to dominate, but niche platforms are providing new avenues for specialized content.</p>" },
    _embedded: {
      'wp:featuredmedia': [{ source_url: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=800&q=80" }],
      'wp:term': [[{ name: "Distribution" }]]
    }
  }
];

/* ============================================================
   1. BLOG LISTING PAGE (blog.html)
   Fetches latest posts and renders them as cards
   ============================================================ */

/**
 * Load and display latest blog posts
 * Called from blog.html on page load
 * Posts are fetched from WordPress REST API
 */
async function fetchBlogPosts(page = 1) {
  const container = document.getElementById('blogPostsContainer');
  const paginationEl = document.getElementById('blogPagination');

  if (!container) return;

  /* Show loading spinner */
  container.innerHTML = `
    <div class="col-12 blog-loading">
      <div class="spinner-border" role="status"></div>
      <p class="mt-3 text-accent">Checking for latest posts...</p>
    </div>`;

  try {
    // Check if WordPress URL is still default. If so, go straight to fallback.
    if (WP_CONFIG.siteUrl.includes("your-wordpress-site.com")) {
      renderPosts(DUMMY_POSTS, 1, 1);
      return;
    }

    /* 
     * Build API URL with pagination and post count parameters
     * WordPress API supports: ?page=1&per_page=6&_embed (for featured images)
     * _embed tells WordPress to include related data (media, author) in response
     */
    const url = `${WP_CONFIG.siteUrl}${WP_CONFIG.postsEndpoint}?page=${page}&per_page=${WP_CONFIG.postsPerPage}&_embed`;

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    /* Get total pages from WordPress response headers */
    const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1', 10);
    const totalPosts = parseInt(response.headers.get('X-WP-Total') || '0', 10);

    /* Parse the JSON array of posts */
    const posts = await response.json();

    if (!posts.length) {
      showNoPosts(container);
      return;
    }

    /* Render all post cards */
    renderPosts(posts, page, totalPages);

  } catch (error) {
    console.warn('Using dummy posts due to API issue:', error.message);
    renderPosts(DUMMY_POSTS, 1, 1);
  }

  function renderPosts(posts, page, totalPages) {
    container.innerHTML = posts.map(post => renderBlogCard(post)).join('');
    if (paginationEl) {
      paginationEl.innerHTML = totalPages > 1 ? renderPagination(paginationEl, page, totalPages) : '';
    }
  }
}

/* ============================================================
   2. RENDER A SINGLE BLOG CARD
   Takes a WordPress post object and returns HTML string
   ============================================================ */

/**
 * Build HTML for one blog post card
 * @param {Object} post - WordPress post object from REST API
 * @returns {string} HTML string for the card
 */
function renderBlogCard(post) {
  /* Get featured image from _embedded data (included via ?_embed) */
  let imageUrl = WP_CONFIG.fallbackImage;
  try {
    if (post._embedded && post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'][0]) {
      imageUrl = post._embedded['wp:featuredmedia'][0].source_url;
    }
  } catch (e) { /* use fallback */ }

  /* Get category name (first category if multiple) */
  let category = 'Publishing';
  try {
    if (post._embedded && post._embedded['wp:term'] && post._embedded['wp:term'][0] && post._embedded['wp:term'][0][0]) {
      category = post._embedded['wp:term'][0][0].name;
    }
  } catch (e) { /* use default */ }

  /* Format date using helper from config.js */
  const formattedDate = formatWPDate(post.date);

  /* Strip HTML tags from excerpt and truncate */
  const excerpt = truncateText(post.excerpt.rendered, 120);

  /* Decode HTML entities in title (WordPress encodes & to &amp; etc.) */
  const title = decodeHTMLEntities(post.title.rendered);

  return `
    <div class="col-md-6 col-lg-4 animate-fade-up">
      <div class="blog-card h-100">
        <div class="overflow-hidden">
          <img src="${imageUrl}" 
               alt="${title}" 
               class="blog-card-img w-100"
               onerror="this.src='${WP_CONFIG.fallbackImage}'"
               loading="lazy">
        </div>
        <div class="blog-card-body">
          <div class="blog-meta">
            <span class="blog-category">${category}</span>
            <span><i class="fas fa-calendar-alt me-1"></i>${formattedDate}</span>
          </div>
          <h5>${title}</h5>
          <p>${excerpt}</p>
          <a href="blog-single.html?id=${post.id}" class="blog-read-more">
            Read More <i class="fas fa-arrow-right"></i>
          </a>
        </div>
      </div>
    </div>`;
}

/* ============================================================
   3. BLOG SINGLE PAGE (blog-single.html)
   Fetches one post by ID from URL param ?id=123
   ============================================================ */

/**
 * Load and display a single blog post
 * Gets post ID from URL query string: blog-single.html?id=123
 */
async function fetchSinglePost() {
  /* Extract post ID from URL parameters */
  const params = new URLSearchParams(window.location.search);
  const postId = params.get('id');
  const container = document.getElementById('singlePostContainer');

  if (!container || !postId) {
    if (container) container.innerHTML = '<p class="text-muted text-center py-5">Post not found.</p>';
    return;
  }

  container.innerHTML = `
    <div class="blog-loading">
      <div class="spinner-border" role="status"></div>
      <p class="mt-3 text-accent">Loading post content...</p>
    </div>`;

  try {
    // If it's a dummy post ID or WordPress not configured, use dummy data
    if (postId >= 101 && postId <= 103 || WP_CONFIG.siteUrl.includes("your-wordpress-site.com")) {
      const dummyPost = DUMMY_POSTS.find(p => p.id == postId) || DUMMY_POSTS[0];
      renderSinglePost(dummyPost);
      return;
    }

    const url = `${WP_CONFIG.siteUrl}${WP_CONFIG.postsEndpoint}/${postId}?_embed`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Post not found`);

    const post = await response.json();
    renderSinglePost(post);

  } catch (error) {
    console.warn('Falling back to dummy post:', error.message);
    const dummyPost = DUMMY_POSTS.find(p => p.id == postId) || DUMMY_POSTS[0];
    renderSinglePost(dummyPost);
  }

  function renderSinglePost(post) {
    let imageUrl = '';
    try {
      if (post._embedded && post._embedded['wp:featuredmedia'] && post._embedded['wp:featuredmedia'][0]) {
        imageUrl = post._embedded['wp:featuredmedia'][0].source_url;
      }
    } catch (e) { }

    const title = decodeHTMLEntities(post.title.rendered);
    document.title = `${title} - SPARTA BOOK PUBLISHING`;

    container.innerHTML = `
      <div class="animate-fade-in">
        ${imageUrl ? `<img src="${imageUrl}" alt="${title}" class="blog-post-featured-img w-100 rounded-4 shadow-sm mb-4">` : ''}
        <div class="blog-meta mb-3">
          <span class="blog-category">Publishing</span>
          <span class="ms-3 text-muted"><i class="fas fa-calendar-alt me-1"></i>${formatWPDate(post.date)}</span>
        </div>
        <h1 class="section-title mb-4" style="font-size: 2.5rem;">${title}</h1>
        <div class="blog-post-content fs-5 text-white-50">${post.content.rendered}</div>
      </div>`;

    fetchPostComments(post.id);
  }
}

/* ============================================================
   4. COMMENTS - Fetch comments for a post
   Comments are stored in WordPress database.
   To view/manage: WordPress Admin > Comments
   ============================================================ */

/**
 * Fetch and display comments for a specific post
 * @param {string|number} postId - The WordPress post ID
 */
async function fetchPostComments(postId) {
  const container = document.getElementById('commentsContainer');
  const countEl = document.getElementById('commentsCount');
  if (!container) return;

  container.innerHTML = '<p class="text-muted">Loading remarks...</p>';

  try {
    // Dummy comments for testing
    if (postId >= 101 && postId <= 103) {
      renderComments([
        { author_name: "James Miller", date: new Date().toISOString(), content: { rendered: "This was incredibly helpful! Looking forward to more tips." } },
        { author_name: "Sarah Jenkins", date: new Date().toISOString(), content: { rendered: "Great article. The part about cover design really resonated." } }
      ]);
      return;
    }

    const url = `${WP_CONFIG.siteUrl}${WP_CONFIG.commentsEndpoint}?post=${postId}&status=approve&per_page=${WP_CONFIG.commentsPerPost}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Comments fetch failed`);

    const comments = await response.json();
    renderComments(comments);

  } catch (error) {
    console.warn('No comments found or error:', error.message);
    container.innerHTML = '<p class="text-muted">No comments yet. Share your thoughts below!</p>';
    if (countEl) countEl.textContent = '0';
  }

  function renderComments(comments) {
    if (countEl) countEl.textContent = comments.length;
    if (!comments.length) {
      container.innerHTML = '<p class="text-muted text-center py-4">No comments yet. Be the first to join the conversation!</p>';
      return;
    }
    container.innerHTML = comments.map(comment => `
      <div class="comment-card p-3 mb-3 rounded-3" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);">
        <div class="d-flex align-items-center mb-2">
          <span class="comment-author fw-bold text-accent me-3">${decodeHTMLEntities(comment.author_name)}</span>
          <span class="comment-date small text-muted">${formatWPDate(comment.date)}</span>
        </div>
        <div class="comment-text text-white-75">${stripHTML(comment.content.rendered)}</div>
      </div>`).join('');
  }
}

/* ============================================================
   5. COMMENT SUBMISSION
   POSTs a new comment to WordPress REST API
   
   📌 HOW COMMENTS ARE SAVED:
   - POST request to /wp-json/wp/v2/comments
   - WordPress saves comment to its database
   - Comment appears in WP Admin > Comments
   - If moderation is enabled, it needs approval first
   - After approval, it appears on the post automatically
   ============================================================ */

/**
 * Initialize comment form submission handler
 * Called from blog-single.html page
 */
function initCommentForm() {
  const form = document.getElementById('commentForm');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const submitBtn = form.querySelector('button[type="submit"]');
    const successEl = document.getElementById('commentSuccess');
    const errorEl = document.getElementById('commentError');

    /* Get post ID from URL */
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('id');

    if (!postId) {
      showCommentError(errorEl, 'Cannot identify post. Please refresh the page.');
      return;
    }

    /* Validate form */
    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      return;
    }

    /* Get form data */
    const commentData = {
      post: parseInt(postId, 10),
      author_name: document.getElementById('commentName').value.trim(),
      author_email: document.getElementById('commentEmail').value.trim(),
      content: document.getElementById('commentContent').value.trim(),
    };

    /* Loading state */
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Submitting...';
    if (successEl) successEl.style.display = 'none';
    if (errorEl) errorEl.style.display = 'none';

    try {
      /* 
       * POST comment to WordPress REST API
       * WordPress saves it to database 
       * Status: approved (instant) or needs moderation based on WP settings
       */
      const response = await fetch(`${WP_CONFIG.siteUrl}${WP_CONFIG.commentsEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commentData),
      });

      const result = await response.json();

      if (response.ok) {
        /* Comment submitted successfully */
        if (successEl) {
          const msg = WP_CONFIG.commentModeration
            ? 'Your comment is submitted and awaiting moderation. Thank you!'
            : 'Your comment has been posted!';
          successEl.querySelector('p').textContent = msg;
          successEl.style.display = 'block';
        }
        form.reset();
        form.classList.remove('was-validated');

        /* Refresh comments list after short delay */
        setTimeout(() => fetchPostComments(postId), 1500);

      } else {
        /* WordPress returned an error */
        const errMsg = result.message || 'Failed to submit comment. Please try again.';
        showCommentError(errorEl, errMsg);
      }

    } catch (err) {
      console.error('Comment submission error:', err);
      showCommentError(errorEl, 'Network error. Please check your connection and try again.');
    } finally {
      /* Reset button state */
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-paper-plane me-2"></i>Post Comment';
    }
  });
}

/* ============================================================
   6. HELPER: Show error message on comment form
   ============================================================ */
function showCommentError(el, msg) {
  if (el) {
    el.querySelector('p').textContent = msg;
    el.style.display = 'block';
  }
}

/* ============================================================
   7. HELPER: Show "No Posts" message
   ============================================================ */
function showNoPosts(container) {
  container.innerHTML = `
    <div class="col-12 text-center py-5">
      <i class="fas fa-book-open fa-3x text-accent mb-3 d-block"></i>
      <h5 class="text-white">No posts published yet.</h5>
      <p class="text-muted">Check back soon for publishing tips and updates!</p>
    </div>`;
}

/* ============================================================
   8. HELPER: Show API Config Notice
   Shown when WordPress API is not yet configured
   ============================================================ */
function showAPIConfigNotice(container) {
  container.innerHTML = `
    <div class="col-12">
      <div class="blog-api-notice">
        <i class="fas fa-cog"></i>
        <h5 class="text-accent mb-2">WordPress API Not Configured</h5>
        <p class="mb-1">To show blog posts, configure your WordPress URL in:</p>
        <code style="color: var(--color-accent); font-size: 0.9rem;">js/config.js</code>
        <p class="mt-2 mb-0">Set the <strong>siteUrl</strong> to your WordPress website URL.</p>
      </div>
    </div>`;
}

/* ============================================================
   9. RENDER PAGINATION for blog listing
   ============================================================ */
function renderPagination(container, currentPage, totalPages) {
  let html = '<nav><ul class="pagination justify-content-center gap-2">';

  /* Previous button */
  html += `<li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
    <a class="page-link" href="#" onclick="changePage(${currentPage - 1}); return false;" 
       style="background: var(--color-bg-card); border-color: var(--color-border); color: var(--color-accent);">
      <i class="fas fa-chevron-left"></i>
    </a>
  </li>`;

  /* Page number buttons */
  for (let i = 1; i <= totalPages; i++) {
    const isActive = i === currentPage;
    html += `<li class="page-item ${isActive ? 'active' : ''}">
      <a class="page-link" href="#" onclick="changePage(${i}); return false;"
         style="background: ${isActive ? 'var(--color-accent)' : 'var(--color-bg-card)'}; 
                border-color: var(--color-border); 
                color: ${isActive ? 'var(--color-primary-dark)' : 'var(--color-accent)'};">
        ${i}
      </a>
    </li>`;
  }

  /* Next button */
  html += `<li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
    <a class="page-link" href="#" onclick="changePage(${currentPage + 1}); return false;"
       style="background: var(--color-bg-card); border-color: var(--color-border); color: var(--color-accent);">
      <i class="fas fa-chevron-right"></i>
    </a>
  </li>`;

  html += '</ul></nav>';
  container.innerHTML = html;
}

/* Change page handler */
function changePage(page) {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(() => fetchBlogPosts(page), 300);
}

/* ============================================================
   10. HELPER: Decode HTML entities in WordPress titles
   WordPress encodes '&' as '&amp;', '<' as '&lt;', etc.
   This converts them back to readable text
   ============================================================ */
function decodeHTMLEntities(text) {
  const el = document.createElement('textarea');
  el.innerHTML = text;
  return el.value;
}
