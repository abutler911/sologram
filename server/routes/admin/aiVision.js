// routes/admin/aiVision.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../../middleware/auth');
const { generateCaption } = require('../../controllers/aiVision');

router.post('/caption', protect, authorize('admin'), generateCaption);

module.exports = router;
