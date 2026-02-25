import axios from 'axios';

/**
 * Single source of truth for all Sologram API calls.
 * Base URL and auth headers are set globally in AuthContext via axios.defaults.
 */

const get = (url, params) => axios.get(url, { params }).then((r) => r.data);
const post = (url, data) => axios.post(url, data).then((r) => r.data);
const put = (url, data) => axios.put(url, data).then((r) => r.data);
const del = (url) => axios.delete(url).then((r) => r.data);

export const api = {
  // ── POSTS ──────────────────────────────────────────────────────────────────
  getPosts: (page = 1, limit = 6) => get('/api/posts', { page, limit }),
  searchPosts: (query) => get('/api/posts/search', { query }),
  getPost: (id) => get(`/api/posts/${id}`).then((r) => r.data),
  createPost: (payload) => post('/api/posts', payload),
  updatePost: (id, payload) => put(`/api/posts/${id}`, payload),
  deletePost: (id) => del(`/api/posts/${id}`),
  likePost: (id) => post(`/api/posts/${id}/like`),
  checkLikeStatus: (id) => get(`/api/posts/${id}/likes/check`),
  batchCheckLikes: (postIds) =>
    post('/api/posts/likes/check-batch', { postIds }),

  // ── STORIES ────────────────────────────────────────────────────────────────
  getStories: () => get('/api/stories').then((r) => r.data),
  getStory: (id) => get(`/api/stories/${id}`).then((r) => r.data),
  createStory: (fd) => post('/api/stories', fd),
  archiveStory: (id) => put(`/api/stories/${id}/archive`, {}),
  deleteStory: (id) => del(`/api/stories/${id}`),

  // ── ARCHIVED STORIES ───────────────────────────────────────────────────────
  getArchivedStories: () => get('/api/archived-stories').then((r) => r.data),
  getArchivedStory: (id) =>
    get(`/api/archived-stories/${id}`).then((r) => r.data),
  deleteArchivedStory: (id) => del(`/api/archived-stories/${id}`),

  // ── THOUGHTS ───────────────────────────────────────────────────────────────
  getThoughts: (page = 1, searchQuery = '') =>
    get(searchQuery ? '/api/thoughts/search' : '/api/thoughts', {
      page,
      ...(searchQuery && { query: searchQuery }),
    }),
  getThought: (id) => get(`/api/thoughts/${id}`).then((r) => r.data),
  createThought: (payload) => post('/api/thoughts', payload),
  updateThought: (id, payload) => put(`/api/thoughts/${id}`, payload),
  deleteThought: (id) => del(`/api/thoughts/${id}`),
  likeThought: (id) => put(`/api/thoughts/${id}/like`),
  pinThought: (id) => put(`/api/thoughts/${id}/pin`),

  // ── COLLECTIONS ────────────────────────────────────────────────────────────
  getCollections: () => get('/api/collections').then((r) => r.data),
  getCollection: (id) => get(`/api/collections/${id}`).then((r) => r.data),
  createCollection: (payload) => post('/api/collections', payload),
  updateCollection: (id, p) => put(`/api/collections/${id}`, p),
  deleteCollection: (id) => del(`/api/collections/${id}`),
  addPostsToCollection: (id, postIds) =>
    post(`/api/collections/${id}/posts`, { postIds }),
  removePostFromCollection: (colId, postId) =>
    del(`/api/collections/${colId}/posts/${postId}`),

  // ── COMMENTS ───────────────────────────────────────────────────────────────
  getCommentCount: (postId) => get(`/api/posts/${postId}/comments/count`),
  getComments: (postId, page = 1) =>
    get(`/api/posts/${postId}/comments`, { page }),
  addComment: (postId, payload) =>
    post(`/api/posts/${postId}/comments`, payload),
  likeComment: (commentId) => post(`/api/comments/${commentId}/like`),
  deleteComment: (commentId) => del(`/api/comments/${commentId}`),
  getReplies: (commentId, page = 1) =>
    get(`/api/comments/${commentId}/replies`, { page }),

  // ── AUTH ───────────────────────────────────────────────────────────────────
  getMe: () => get('/api/auth/me').then((r) => r.data),
  updateProfile: (formData) =>
    put('/api/auth/update-profile', formData).then((r) => r.data),
  updateBio: (bio) => put('/api/auth/update-bio', { bio }).then((r) => r.data),
  updateNotificationPreferences: (prefs) =>
    post('/api/notifications/preferences', prefs),
};
