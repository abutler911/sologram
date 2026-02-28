// routes/webhooks/quickThought.js
// POST /api/thoughts/quick — accepts raw text, refines via AI, publishes.
// Auth: X-API-Key header (for Android shortcut, scripts, etc.)

const express = require('express');
const router = express.Router();
const { apiKeyAuth } = require('../../middleware/apiKeyAuth');
const { refineThought } = require('../../services/ai/thoughtRefiner');
const { createAndNotify } = require('../../services/thoughts/createAndNotify');
const { logger } = require('../../utils/logger');

router.post('/', apiKeyAuth, async (req, res) => {
  const raw = (req.body.text || '').trim();

  if (!raw) {
    return res
      .status(400)
      .json({ success: false, message: 'text is required' });
  }

  if (raw.length > 1000) {
    return res
      .status(400)
      .json({ success: false, message: 'text exceeds 1000 characters' });
  }

  try {
    const refined = await refineThought(raw);

    const thought = await createAndNotify({
      content: refined.content,
      mood: refined.mood,
      tags: refined.tags,
      source: 'shortcut',
    });

    logger.info('[quickThought] Published', {
      context: {
        thoughtId: thought._id.toString(),
        mood: refined.mood,
        tags: refined.tags,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        _id: thought._id,
        content: thought.content,
        mood: thought.mood,
        tags: thought.tags,
        createdAt: thought.createdAt,
      },
    });
  } catch (err) {
    logger.error('[quickThought] Pipeline failed', {
      context: { error: err.message },
    });
    res
      .status(500)
      .json({ success: false, message: 'Failed to create thought' });
  }
});

module.exports = router;
