const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const { 
  login, 
  getMe, 
  updateProfile 
} = require('../controllers/auth');
const { protect } = require('../middleware/auth');

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', login);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', protect, getMe);

// @route   PUT /api/auth/update-profile
// @desc    Update profile
// @access  Private
router.put('/update-profile', protect, upload.single('profileImage'), updateProfile);

module.exports = router;