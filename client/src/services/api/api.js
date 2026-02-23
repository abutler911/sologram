// client/src/services/api.js
//
// Single source of truth for all API calls.
// Components and hooks never import axios directly — they use this file.
// Auth header is handled automatically by the axios default set in AuthContext.

import axios from 'axios';

export const api = {
  // ── POSTS ──────────────────────────────────────────────────────────
  getPosts: (page = 1, limit = 6) =>
    axios.get('/api/posts', { params: { page, limit } }).then((r) => r.data),

  getPost: (id) => axios.get(`/api/posts/${id}`).then((r) => r.data.data),

  createPost: (payload) =>
    axios.post('/api/posts', payload).then((r) => r.data),

  updatePost: (id, payload) =>
    axios.put(`/api/posts/${id}`, payload).then((r) => r.data),

  deletePost: (id) => axios.delete(`/api/posts/${id}`).then((r) => r.data),

  likePost: (id) => axios.post(`/api/posts/${id}/like`).then((r) => r.data),

  checkLikeStatus: (id) =>
    axios.get(`/api/posts/${id}/like`).then((r) => r.data),

  batchCheckLikes: (postIds) =>
    axios.post('/api/posts/likes/check-batch', { postIds }).then((r) => r.data),

  // ── STORIES ────────────────────────────────────────────────────────
  getStories: () => axios.get('/api/stories').then((r) => r.data.data),

  getStory: (id) => axios.get(`/api/stories/${id}`).then((r) => r.data.data),

  createStory: (formData) =>
    axios.post('/api/stories', formData).then((r) => r.data),

  archiveStory: (id) =>
    axios.put(`/api/stories/${id}/archive`, {}).then((r) => r.data),

  deleteStory: (id) => axios.delete(`/api/stories/${id}`).then((r) => r.data),

  // ── ARCHIVED STORIES ───────────────────────────────────────────────
  getArchivedStories: () =>
    axios.get('/api/archived-stories').then((r) => r.data.data),

  getArchivedStory: (id) =>
    axios.get(`/api/archived-stories/${id}`).then((r) => r.data.data),

  deleteArchivedStory: (id) =>
    axios.delete(`/api/archived-stories/${id}`).then((r) => r.data),

  // ── THOUGHTS ───────────────────────────────────────────────────────
  getThoughts: (page = 1, searchQuery = '') =>
    axios
      .get(searchQuery ? '/api/thoughts/search' : '/api/thoughts', {
        params: { page, ...(searchQuery && { query: searchQuery }) },
      })
      .then((r) => r.data),

  getThought: (id) => axios.get(`/api/thoughts/${id}`).then((r) => r.data.data),

  createThought: (payload) =>
    axios.post('/api/thoughts', payload).then((r) => r.data),

  updateThought: (id, payload) =>
    axios.put(`/api/thoughts/${id}`, payload).then((r) => r.data),

  deleteThought: (id) =>
    axios.delete(`/api/thoughts/${id}`).then((r) => r.data),

  likeThought: (id) =>
    axios.put(`/api/thoughts/${id}/like`).then((r) => r.data),

  pinThought: (id) => axios.put(`/api/thoughts/${id}/pin`).then((r) => r.data),

  // ── COLLECTIONS ────────────────────────────────────────────────────
  getCollections: () => axios.get('/api/collections').then((r) => r.data.data),

  getCollection: (id) =>
    axios.get(`/api/collections/${id}`).then((r) => r.data.data),

  createCollection: (payload) =>
    axios.post('/api/collections', payload).then((r) => r.data),

  updateCollection: (id, payload) =>
    axios.put(`/api/collections/${id}`, payload).then((r) => r.data),

  deleteCollection: (id) =>
    axios.delete(`/api/collections/${id}`).then((r) => r.data),

  addPostsToCollection: (id, postIds) =>
    axios.post(`/api/collections/${id}/posts`, { postIds }).then((r) => r.data),

  removePostFromCollection: (collectionId, postId) =>
    axios
      .delete(`/api/collections/${collectionId}/posts/${postId}`)
      .then((r) => r.data),

  // ── COMMENTS ───────────────────────────────────────────────────────
  getComments: (postId) =>
    axios.get(`/api/posts/${postId}/comments`).then((r) => r.data),

  addComment: (postId, payload) =>
    axios.post(`/api/posts/${postId}/comments`, payload).then((r) => r.data),

  likeComment: (commentId) =>
    axios.post(`/api/comments/${commentId}/like`).then((r) => r.data),

  deleteComment: (commentId) =>
    axios.delete(`/api/comments/${commentId}`).then((r) => r.data),

  // ── AUTH ───────────────────────────────────────────────────────────
  getMe: () => axios.get('/api/auth/me').then((r) => r.data.data),

  updateProfile: (formData) =>
    axios.put('/api/auth/update-profile', formData).then((r) => r.data.data),

  updateBio: (bio) =>
    axios.put('/api/auth/update-bio', { bio }).then((r) => r.data.data),

  updateNotificationPreferences: (preferences) =>
    axios
      .post('/api/notifications/preferences', preferences)
      .then((r) => r.data),
};
