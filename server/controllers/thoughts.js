const Thought = require("../models/Thought");
const { cloudinary } = require("../config/cloudinary");

exports.getThoughts = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    const pinnedThoughts = await Thought.find({ pinned: true })
      .sort({ createdAt: -1 })
      .limit(5);

    const regularThoughts = await Thought.find({ pinned: false })
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    const thoughts = [...pinnedThoughts, ...regularThoughts];

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

exports.createThought = async (req, res) => {
  try {
    const { content, mood, tags } = req.body;

    const thoughtData = {
      content,
      mood: mood || "creative",
      tags: tags ? JSON.parse(tags) : [],
    };

    if (req.file) {
      thoughtData.media = {
        mediaType: "image",
        mediaUrl: req.file.path,
        cloudinaryId: req.file.filename,
      };
    }

    const thought = await Thought.create(thoughtData);

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

    if (content) thought.content = content;
    if (mood) thought.mood = mood;
    if (tags) thought.tags = JSON.parse(tags);

    if (req.file) {
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

exports.deleteThought = async (req, res) => {
  try {
    const thought = await Thought.findById(req.params.id);

    if (!thought) {
      return res.status(404).json({
        success: false,
        message: "Thought not found",
      });
    }

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

exports.pinThought = async (req, res) => {
  try {
    const thought = await Thought.findById(req.params.id);

    if (!thought) {
      return res.status(404).json({
        success: false,
        message: "Thought not found",
      });
    }

    thought.pinned = !thought.pinned;

    if (thought.pinned) {
      const pinnedCount = await Thought.countDocuments({ pinned: true });

      if (pinnedCount >= 5) {
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
