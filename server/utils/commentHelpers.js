// utils/commentHelpers.js
// ─────────────────────────────────────────────────────────────────────────────
// Shared formatting helpers for comments.
// Previously duplicated in routes/posts.js and routes/comments.js.
// ─────────────────────────────────────────────────────────────────────────────

/** Strip HTML tags */
const clean = (s = '') =>
  String(s)
    .replace(/<[^>]*>/g, '')
    .trim();

/** Format a populated author subdoc for client consumption */
const safeAuthor = (a) =>
  a
    ? {
        _id: a._id,
        name:
          [a.firstName, a.lastName].filter(Boolean).join(' ') ||
          a.username ||
          'Unknown',
        username: a.username || '',
        avatar: a.profileImage || null,
      }
    : { _id: null, name: 'Unknown', username: '', avatar: null };

/** Format a comment lean doc for the client.  `uid` = current user's ID string. */
const fmtComment = (c, uid) => ({
  ...c,
  author: safeAuthor(c.author),
  hasLiked: false, // Likes are now tracked via the unified Like model — check separately
  likes: 0, // Will be populated by the route using Like.countDocuments
  replyCount: Array.isArray(c.replies) ? c.replies.length : 0,
});

module.exports = { clean, safeAuthor, fmtComment };
