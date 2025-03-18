// controllers/stories.js
const Story = require("../models/Story");

// Get all stories
exports.getStories = async (req, res) => {
  try {
    const stories = await Story.find().sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: stories.length,
      data: stories,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Create a new story
exports.createStory = async (req, res) => {
  try {
    const { title } = req.body;

    const media = req.files.map((file) => ({
      mediaType: file.mimetype.startsWith("image") ? "image" : "video",
      mediaUrl: file.path,
    }));

    const story = await Story.create({
      title,
      media,
    });

    res.status(201).json({
      success: true,
      data: story,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Delete a story
exports.deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    await story.remove();

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
