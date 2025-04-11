// controllers/thoughts.js
const Thought = require("../models/Thought");
const { cloudinary } = require("../config/cloudinary");
const notificationService = require("../services/notificationService");

// Get all thoughts with pagination
exports.getThoughts = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Find pinned thoughts first
    const pinnedThoughts = await Thought.find({ pinned: true })
      .sort({ createdAt: -1 })
      .limit(5);

    // Get regular thoughts (excluding pinned ones)
    const regularThoughts = await Thought.find({ pinned: false })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    // Combine thoughts with pinned first
    const thoughts = [...pinnedThoughts, ...regularThoughts];

    // Get total count for pagination
    const total = await Thought.countDocuments({ pinned: false });

    res.status(200).json({
      success: true,
      count: thoughts.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: thoughts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Get single thought
exports.getThought = async (req, res) => {
  try {
    const thought = await Thought.findById(req.params.id);

    if (!thought) {
      return res.status(404).json({
        success: false,
        message: "Thought not found",
      });
    }

    res.status(200).json({
      success: true,
      data: thought,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Create a new thought
exports.createThought = async (req, res) => {
  try {
    const { content, mood, tags } = req.body;

    const thoughtData = {
      content,
      mood: mood || "creative",
      tags: tags ? JSON.parse(tags) : [],
    };

    // Handle media upload
    if (req.file) {
      thoughtData.media = {
        mediaType: "image",
        mediaUrl: req.file.path,
        cloudinaryId: req.file.filename,
      };
    }

    const thought = await Thought.create(thoughtData);

    // Notify subscribers about new thought
    if (process.env.NODE_ENV === "production") {
      try {
        await notificationService.notifyNewThought(thought);
      } catch (notifyErr) {
        console.error("Failed to send notification:", notifyErr);
      }
    }

    res.status(201).json({
      success: true,
      data: thought,
    });
  } catch (err) {
    console.error(err);

    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Update thought
exports.updateThought = async (req, res) => {
  try {
    let thought = await Thought.findById(req.params.id);

    if (!thought) {
      return res.status(404).json({
        success: false,
        message: "Thought not found",
      });
    }

    const { content, mood, tags } = req.body;

    // Update fields
    if (content) thought.content = content;
    if (mood) thought.mood = mood;
    if (tags) thought.tags = JSON.parse(tags);

    // Handle media upload
    if (req.file) {
      // Delete old image if exists
      if (thought.media?.cloudinaryId) {
        await cloudinary.uploader.destroy(thought.media.cloudinaryId);
      }

      thought.media = {
        mediaType: "image",
        mediaUrl: req.file.path,
        cloudinaryId: req.file.filename,
      };
    }

    await thought.save();

    res.status(200).json({
      success: true,
      data: thought,
    });
  } catch (err) {
    console.error(err);

    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Delete thought
exports.deleteThought = async (req, res) => {
  try {
    const thought = await Thought.findById(req.params.id);

    if (!thought) {
      return res.status(404).json({
        success: false,
        message: "Thought not found",
      });
    }

    // Delete image from Cloudinary if exists
    if (thought.media?.cloudinaryId) {
      await cloudinary.uploader.destroy(thought.media.cloudinaryId);
    }

    await thought.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Like a thought
exports.likeThought = async (req, res) => {
  try {
    const thought = await Thought.findById(req.params.id);

    if (!thought) {
      return res.status(404).json({
        success: false,
        message: "Thought not found",
      });
    }

    thought.likes += 1;
    await thought.save();

    res.status(200).json({
      success: true,
      data: thought,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Pin/unpin a thought
exports.pinThought = async (req, res) => {
  try {
    const thought = await Thought.findById(req.params.id);

    if (!thought) {
      return res.status(404).json({
        success: false,
        message: "Thought not found",
      });
    }

    // Toggle pinned status
    thought.pinned = !thought.pinned;

    // If pinning this thought, unpin others if we already have 5 pinned
    if (thought.pinned) {
      const pinnedCount = await Thought.countDocuments({ pinned: true });

      if (pinnedCount >= 5) {
        // Get oldest pinned thought and unpin it
        const oldestPinned = await Thought.findOne({ pinned: true }).sort({
          createdAt: 1,
        });

        if (oldestPinned) {
          oldestPinned.pinned = false;
          await oldestPinned.save();
        }
      }
    }

    await thought.save();

    res.status(200).json({
      success: true,
      data: thought,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
