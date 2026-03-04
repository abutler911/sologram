const express = require('express');
const router = express.Router();

const {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  searchPosts,
  deleteMedia,
} = require('../controllers/posts');

const { protect } = require('../middleware/auth');
const { postCreationLimiter } = require('../middleware/rateLimiter');
const optionalAuth = require('../middleware/optionalAuth');

// ─── Routes ─────────────────────────────────────────────────────────────────
// Search must come before /:id to avoid param catch-all
router.get('/search', searchPosts);

router.get('/', optionalAuth, getPosts);
router.get('/:id', optionalAuth, getPost);
router.post('/', protect, postCreationLimiter, createPost);
router.put('/:id', protect, updatePost);
router.delete('/:id', protect, deletePost);
router.delete('/media/:cloudinaryId', protect, deleteMedia);

module.exports = router;
