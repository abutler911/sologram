// routes/copilot.js
// Public endpoint — no auth required. Visitors can chat with the co-pilot.

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { chat } = require('../controllers/copilot');

// Rate limit: 20 messages per 15 minutes per IP
const copilotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    success: false,
    message: 'Too many messages — try again in a few minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/chat', copilotLimiter, chat);

module.exports = router;
