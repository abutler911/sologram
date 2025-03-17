// server/routes/collections.js
const express = require('express');
const router = express.Router();
const { 
  getCollections, 
  getCollection, 
  createCollection, 
  updateCollection, 
  deleteCollection,
  addPostToCollection,
  removePostFromCollection 
} = require('../controllers/collections');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// @route   GET /api/collections
// @desc    Get all collections
// @access  Public
router.get('/', getCollections);

// @route   GET /api/collections/:id
// @desc    Get a single collection
// @access  Public
router.get('/:id', getCollection);

// @route   POST /api/collections
// @desc    Create a collection
// @access  Private/Admin
router.post('/', protect, authorize('admin'), upload.single('coverImage'), createCollection);

// @route   PUT /api/collections/:id
// @desc    Update a collection
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), upload.single('coverImage'), updateCollection);

// @route   DELETE /api/collections/:id
// @desc    Delete a collection
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), deleteCollection);

// @route   POST /api/collections/:id/posts
// @desc    Add a post to a collection
// @access  Private/Admin
router.post('/:id/posts', protect, authorize('admin'), addPostToCollection);

// @route   DELETE /api/collections/:id/posts/:postId
// @desc    Remove a post from a collection
// @access  Private/Admin
router.delete('/:id/posts/:postId', protect, authorize('admin'), removePostFromCollection);

module.exports = router;