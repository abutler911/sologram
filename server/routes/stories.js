const express = require('express');
const router = express.Router();
const {
  getStories,
  getStory,
  createStory,
  getArchivedStories,
  getArchivedStory,
  archiveStory,
  deleteStory,
  deleteArchivedStory,
} = require('../controllers/stories');
const { protect, authorize } = require('../middleware/auth');
const { storyCreationLimiter } = require('../middleware/rateLimiter');

// Active stories
router.get('/', getStories);
router.get('/archived', protect, getArchivedStories); // must come before /:id
router.get('/archived/:id', protect, getArchivedStory);
router.get('/:id', getStory);

// Create — JSON body only, no multer (media already uploaded to Cloudinary by client)
router.post(
  '/',
  protect,
  authorize(['admin', 'creator']),
  storyCreationLimiter,
  createStory
);

router.put(
  '/:id/archive',
  protect,
  authorize(['admin', 'creator']),
  archiveStory
);
router.delete(
  '/archived/:id',
  protect,
  authorize(['admin', 'creator']),
  deleteArchivedStory
);
router.delete('/:id', protect, authorize(['admin', 'creator']), deleteStory);

module.exports = router;
