const express = require('express');
const router = express.Router();

const {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  likePost,
  checkUserLike,
  searchPosts,
  checkUserLikesBatch,
} = require('../controllers/posts');
const { protect } = require('../middleware/auth');
const { postCreationLimiter } = require('../middleware/rateLimiter');

// ─── IMPORTANT: Specific routes BEFORE param routes ─────────────────────────

// Public
router.get('/search', searchPosts);
router.get('/', getPosts);

// FIX: batch check must be declared before /:id to avoid Express treating
// "likes" as a post ID. POST /likes/check-batch != POST /:id/like (different
// segment count) but explicit ordering is clearer and safer.
router.post('/likes/check-batch', protect, checkUserLikesBatch);

// Param routes (public read, protected write)
router.get('/:id', getPost);

router.post('/', protect, postCreationLimiter, createPost);
router.put('/:id', protect, updatePost);
router.delete('/:id', protect, deletePost);

router.post('/:id/like', protect, likePost);
router.get('/:id/likes/check', protect, checkUserLike);

module.exports = router;
