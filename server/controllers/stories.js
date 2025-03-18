// controllers/stories.js
const Story = require("../models/Story");

// Get all stories (non-archived only)
exports.getStories = async (req, res) => {
  try {
    const stories = await Story.find({ archived: false }).sort({
      createdAt: -1,
    });
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

// Get a single story
exports.getStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    res.status(200).json({
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
    await story.deleteOne();
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

// Get archived stories
exports.getArchivedStories = async (req, res) => {
  try {
    const archivedStories = await Story.find({
      archived: true,
    }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: archivedStories.length,
      data: archivedStories,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Get a single archived story
exports.getArchivedStory = async (req, res) => {
  try {
    const story = await Story.findOne({
      _id: req.params.id,
      archived: true,
    });

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Archived story not found",
      });
    }

    res.status(200).json({
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

// Manually archive a story
exports.archiveStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }
    story.archived = true;
    await story.save();
    res.status(200).json({
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

// Delete an archived story permanently
exports.deleteArchivedStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }
    if (!story.archived) {
      return res.status(400).json({
        success: false,
        message: "Story must be archived before it can be deleted",
      });
    }
    await story.deleteOne();
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
