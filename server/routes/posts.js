const express = require('express');
const router = express.Router();
const { likeLimiter } = require('../middleware/rateLimiter');
const { upload, uploadMultiple } = require('../config/cloudinary');
const {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  searchPosts,
  likePost
} = require('../controllers/posts');
const { protect } = require('../middleware/auth');

router.get('/', getPosts);

router.get('/search', searchPosts);

router.get('/:id', getPost);

router.post('/', protect, uploadMultiple.array('media', 20), createPost);

router.put('/:id', protect, uploadMultiple.array('media', 20), updatePost);

router.delete('/:id', protect, deletePost);

router.put('/:id/like', likeLimiter, likePost);

module.exports = router;