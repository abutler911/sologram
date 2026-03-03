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

// ─── Routes ─────────────────────────────────────────────────────────────────
// Search must come before /:id to avoid param catch-all
router.get('/search', searchPosts);

router.get('/', getPosts);
router.get('/:id', getPost);
router.post('/', protect, postCreationLimiter, createPost);
router.put('/:id', protect, updatePost);
router.delete('/:id', protect, deletePost);
router.delete('/media/:cloudinaryId', protect, deleteMedia);

module.exports = router;
