// controllers/thoughts.js
const Thought = require('../models/Thought');
const { cloudinary } = require('../config/cloudinary');
const { createAndNotify } = require('../services/thoughts/createAndNotify');

// ── List (paginated, pinned first) ────────────────────────────────────────────
exports.getThoughts = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const [pinnedThoughts, regularThoughts, total] = await Promise.all([
      Thought.find({ pinned: true }).sort({ createdAt: -1 }).limit(5),
      Thought.find({ pinned: false })
        .sort({ createdAt: -1 })
        .skip(startIndex)
        .limit(limit),
      Thought.countDocuments({ pinned: false }),
    ]);

    res.status(200).json({
      success: true,
      count: pinnedThoughts.length + regularThoughts.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: [...pinnedThoughts, ...regularThoughts],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ── Single ────────────────────────────────────────────────────────────────────
exports.getThought = async (req, res) => {
  try {
    const thought = await Thought.findById(req.params.id);
    if (!thought) {
      return res
        .status(404)
        .json({ success: false, message: 'Thought not found' });
    }
    res.status(200).json({ success: true, data: thought });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ── Create (web UI) ───────────────────────────────────────────────────────────
exports.createThought = async (req, res) => {
  try {
    const { content, mood, tags } = req.body;

    const data = {
      content,
      mood: mood || 'creative',
      tags: tags ? JSON.parse(tags) : [],
      source: 'web',
    };

    if (req.file) {
      data.media = {
        mediaType: 'image',
        mediaUrl: req.file.path,
        cloudinaryId: req.file.filename,
      };
    }

    const thought = await createAndNotify(data);

    res.status(201).json({ success: true, data: thought });
  } catch (err) {
    console.error(err);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((val) => val.message);
      return res
        .status(400)
        .json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ── Update ────────────────────────────────────────────────────────────────────
exports.updateThought = async (req, res) => {
  try {
    const thought = await Thought.findById(req.params.id);
    if (!thought) {
      return res
        .status(404)
        .json({ success: false, message: 'Thought not found' });
    }

    const { content, mood, tags } = req.body;
    if (content) thought.content = content;
    if (mood) thought.mood = mood;
    if (tags) thought.tags = JSON.parse(tags);

    if (req.file) {
      if (thought.media?.cloudinaryId) {
        await cloudinary.uploader.destroy(thought.media.cloudinaryId);
      }
      thought.media = {
        mediaType: 'image',
        mediaUrl: req.file.path,
        cloudinaryId: req.file.filename,
      };
    }

    await thought.save();
    res.status(200).json({ success: true, data: thought });
  } catch (err) {
    console.error(err);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((val) => val.message);
      return res
        .status(400)
        .json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ── Delete ────────────────────────────────────────────────────────────────────
exports.deleteThought = async (req, res) => {
  try {
    const thought = await Thought.findById(req.params.id);
    if (!thought) {
      return res
        .status(404)
        .json({ success: false, message: 'Thought not found' });
    }
    if (thought.media?.cloudinaryId) {
      await cloudinary.uploader.destroy(thought.media.cloudinaryId);
    }
    await thought.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ── Like ──────────────────────────────────────────────────────────────────────
exports.likeThought = async (req, res) => {
  try {
    const thought = await Thought.findById(req.params.id);
    if (!thought) {
      return res
        .status(404)
        .json({ success: false, message: 'Thought not found' });
    }
    thought.likes += 1;
    await thought.save();
    res.status(200).json({ success: true, data: thought });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ── Pin/unpin ─────────────────────────────────────────────────────────────────
exports.pinThought = async (req, res) => {
  try {
    const thought = await Thought.findById(req.params.id);
    if (!thought) {
      return res
        .status(404)
        .json({ success: false, message: 'Thought not found' });
    }

    thought.pinned = !thought.pinned;

    if (thought.pinned) {
      const pinnedCount = await Thought.countDocuments({ pinned: true });
      if (pinnedCount >= 5) {
        const oldest = await Thought.findOne({ pinned: true }).sort({
          createdAt: 1,
        });
        if (oldest) {
          oldest.pinned = false;
          await oldest.save();
        }
      }
    }

    await thought.save();
    res.status(200).json({ success: true, data: thought });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
