const express = require('express');
const router = express.Router();
const { upload, uploadMultiple } = require('../config/cloudinary');
const { 
  getPosts, 
  getPost, 
  createPost, 
  updatePost, 
  deletePost,
  searchPosts 
} = require('../controllers/posts');

// @route   GET /api/posts
// @desc    Get all posts
// @access  Public
router.get('/', getPosts);

// @route   GET /api/posts/search
// @desc    Search posts
// @access  Public
router.get('/search', searchPosts);

// @route   GET /api/posts/:id
// @desc    Get a single post
// @access  Public
router.get('/:id', getPost);

// @route   POST /api/posts
// @desc    Create a post
// @access  Private (will add auth middleware later)
router.post('/', uploadMultiple.array('media', 10), createPost);

// @route   PUT /api/posts/:id
// @desc    Update a post
// @access  Private (will add auth middleware later)
router.put('/:id', uploadMultiple.array('media', 10), updatePost);

// @route   DELETE /api/posts/:id
// @desc    Delete a post
// @access  Private (will add auth middleware later)
router.delete('/:id', deletePost);

module.exports = router;