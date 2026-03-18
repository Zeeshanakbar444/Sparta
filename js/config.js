/* ============================================================
   SPARTA BOOKING PUBLISHING - WordPress API Configuration
   
   📌 HOW TO CONFIGURE:
   1. Open this file (js/config.js)
   2. Replace the 'siteUrl' value with your actual WordPress website URL
   3. Make sure your WordPress site has REST API enabled (it is by default)
   4. Save and refresh the blog pages
   
   📌 COMMENT SYSTEM:
   - Comments are stored in your WordPress database
   - They appear in WordPress Admin > Comments
   - Users must submit name + email + comment to post
   - After submission, comment awaits moderation in WP Admin (unless Open)
   
   📌 TO ALLOW IMMEDIATE COMMENTS (without moderation):
   In WordPress Admin > Settings > Discussion:
   - Uncheck "Comment must be manually approved"
   ============================================================ */

const WP_CONFIG = {

  /* -------------------------------------------------------
     🔗 YOUR WORDPRESS SITE URL
     Replace with your actual WordPress website address.
     Do NOT add a trailing slash.
     Example: "https://myblog.wordpress.com"
              "https://yourdomain.com"
     ------------------------------------------------------- */
  siteUrl: "https://your-wordpress-site.com",  // ← ⚠️ CHANGE THIS URL

  /* -------------------------------------------------------
     📋 API ENDPOINTS (Do not change these unless needed)
     These are standard WordPress REST API paths.
     ------------------------------------------------------- */
  postsEndpoint:    "/wp-json/wp/v2/posts",       // Fetch all blog posts
  commentsEndpoint: "/wp-json/wp/v2/comments",    // Fetch & post comments
  mediaEndpoint:    "/wp-json/wp/v2/media",       // Fetch featured images
  categoriesEndpoint: "/wp-json/wp/v2/categories", // Fetch categories
  tagsEndpoint:     "/wp-json/wp/v2/tags",         // Fetch post tags

  /* -------------------------------------------------------
     📊 PAGINATION SETTINGS
     ------------------------------------------------------- */
  postsPerPage:     6,    // Number of posts shown on blog listing page
  commentsPerPost:  20,   // Number of comments shown per blog post

  /* -------------------------------------------------------
     🖼️ FALLBACK IMAGE
     Shown when a post has no featured image
     ------------------------------------------------------- */
  fallbackImage:    "assets/images/hero_bg.png",

  /* -------------------------------------------------------
     📧 COMMENT SUBMISSION SETTINGS
     Comments are stored in WordPress database.
     Moderation depends on your WordPress Discussion settings.
     ------------------------------------------------------- */
  commentModeration: true, // Set to false if WP allows instant comments

};

/* -------------------------------------------------------
   Helper: Build full API URL
   Usage: WP_API_URL('postsEndpoint') 
   Returns: "https://your-site.com/wp-json/wp/v2/posts"
   ------------------------------------------------------- */
function WP_API_URL(endpointKey) {
  return WP_CONFIG.siteUrl + WP_CONFIG[endpointKey];
}

/* -------------------------------------------------------
   Helper: Format WordPress date to readable string
   Example: "2024-01-15T10:30:00" → "January 15, 2024"
   ------------------------------------------------------- */
function formatWPDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/* -------------------------------------------------------
   Helper: Strip HTML tags from WordPress content excerpt
   ------------------------------------------------------- */
function stripHTML(html) {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
}

/* -------------------------------------------------------
   Helper: Truncate text to N characters
   ------------------------------------------------------- */
function truncateText(text, maxLength = 130) {
  const clean = stripHTML(text);
  return clean.length > maxLength ? clean.substring(0, maxLength) + '...' : clean;
}
