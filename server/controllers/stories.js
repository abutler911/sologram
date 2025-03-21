// controllers/stories.js
const mongoose = require("mongoose");
const Story = require("../models/Story");
const cloudinary = require("../config/cloudinary").cloudinary;

// Helper function for handling server errors
const handleServerError = (res, err, customMessage = "Server Error") => {
  console.error(`Error in ${customMessage}:`, {
    message: err.message,
    stack: err.stack,
    name: err.name,
  });

  res.status(500).json({
    success: false,
    message: customMessage,
    ...(process.env.NODE_ENV === "development" && {
      error: err.message,
      stack: err.stack,
    }),
  });
};

// Run this before each request to ensure expired stories are archived
async function checkAndArchiveExpiredStories() {
  try {
    const count = await Story.archiveExpired();
    if (count > 0) {
      console.log(`Automatically archived ${count} expired stories`);
    }
    return count;
  } catch (err) {
    console.error("Error in automatic story archiving:", err);
    return 0;
  }
}

// @desc    Get all active (non-archived) stories
// @route   GET /api/stories
// @access  Public
exports.getStories = async (req, res) => {
  try {
    // Always check for and archive expired stories first
    await checkAndArchiveExpiredStories();

    const stories = await Story.find({ archived: false })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: stories.length,
      data: stories,
    });
  } catch (err) {
    handleServerError(res, err, "Error fetching stories");
  }
};

// @desc    Get a single story by ID
// @route   GET /api/stories/:id
// @access  Public
exports.getStory = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid story ID format",
      });
    }

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
    handleServerError(res, err, "Error fetching story");
  }
};

// @desc    Create a new story
// @route   POST /api/stories
// @access  Private
exports.createStory = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one media file is required",
      });
    }

    if (req.files.length > 10) {
      return res.status(400).json({
        success: false,
        message: "Maximum 10 media files allowed per story",
      });
    }

    const media = req.files.map((file) => ({
      mediaType: file.mimetype.startsWith("image") ? "image" : "video",
      mediaUrl: file.path,
      cloudinaryId: file.filename || file.public_id || null,
    }));

    // Set expiration time to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    // expiresAt.setMinutes(expiresAt.getMinutes() + 2);

    const story = await Story.create({
      title,
      media,
      expiresAt,
    });

    res.status(201).json({
      success: true,
      data: story,
    });
  } catch (err) {
    handleServerError(res, err, "Error creating story");
  }
};

// @desc    Delete a story
// @route   DELETE /api/stories/:id
// @access  Private
exports.deleteStory = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid story ID format",
      });
    }

    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    // Delete all media files from Cloudinary
    if (story.media && story.media.length > 0) {
      for (const media of story.media) {
        if (media.cloudinaryId) {
          try {
            await cloudinary.uploader.destroy(media.cloudinaryId);
          } catch (cloudinaryError) {
            console.error("Error deleting media from Cloudinary:", cloudinaryError);
            // Continue with deletion even if Cloudinary delete fails
          }
        }
      }
    }

    await story.deleteOne();

    res.status(200).json({
      success: true,
      message: "Story deleted successfully",
      data: {},
    });
  } catch (err) {
    handleServerError(res, err, "Error deleting story");
  }
};

// @desc    Manually archive a story
// @route   PUT /api/stories/:id/archive
// @access  Private
exports.archiveStory = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid story ID format",
      });
    }

    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    if (story.archived) {
      return res.status(400).json({
        success: false,
        message: "Story is already archived",
      });
    }

    story.archived = true;
    story.archivedAt = new Date();
    await story.save();

    res.status(200).json({
      success: true,
      message: "Story archived successfully",
      data: story,
    });
  } catch (err) {
    handleServerError(res, err, "Error archiving story");
  }
};

// @desc    Get all archived stories
// @route   GET /api/stories/archived
// @access  Private
exports.getArchivedStories = async (req, res) => {
  try {
    console.log("Fetching archived stories...");

    // Include pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await Story.countDocuments({ archived: true });
    
    // Get archived stories with pagination
    const archivedStories = await Story.find({ archived: true })
      .sort({ archivedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    console.log(`Found ${archivedStories.length} archived stories (total: ${total})`);

    res.status(200).json({
      success: true,
      count: archivedStories.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: archivedStories,
    });
  } catch (err) {
    handleServerError(res, err, "Error fetching archived stories");
  }
};

// @desc    Get a single archived story
// @route   GET /api/stories/archived/:id
// @access  Private
exports.getArchivedStory = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid story ID format",
      });
    }

    // Find the story by ID, regardless of archived status
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    // If the story isn't archived, return with a message
    if (!story.archived) {
      return res.status(400).json({
        success: false,
        message: "This story is not archived",
      });
    }

    res.status(200).json({
      success: true,
      data: story,
    });
  } catch (err) {
    handleServerError(res, err, "Error fetching archived story");
  }
};

// @desc    Delete an archived story
// @route   DELETE /api/stories/archived/:id
// @access  Private
exports.deleteArchivedStory = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid story ID format",
      });
    }

    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    // Verify the story is archived
    if (!story.archived) {
      return res.status(400).json({
        success: false,
        message: "Only archived stories can be deleted from the archive",
      });
    }

    // Delete all media files from Cloudinary
    if (story.media && story.media.length > 0) {
      for (const media of story.media) {
        if (media.cloudinaryId) {
          try {
            await cloudinary.uploader.destroy(media.cloudinaryId);
          } catch (cloudinaryError) {
            console.error("Error deleting media from Cloudinary:", cloudinaryError);
            // Continue with deletion even if Cloudinary delete fails
          }
        }
      }
    }

    await story.deleteOne();

    res.status(200).json({
      success: true,
      message: "Archived story deleted successfully",
      data: {},
    });
  } catch (err) {
    handleServerError(res, err, "Error deleting archived story");
  }
};