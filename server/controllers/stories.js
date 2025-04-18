// controllers/stories.js
const mongoose = require("mongoose");
const Story = require("../models/Story");
const cloudinary = require("../config/cloudinary").cloudinary;
const notificationService = require("../services/notificationService");

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
// In server/controllers/stories.js - Update the createStory function

exports.createStory = async (req, res) => {
  try {
    const { title } = req.body;

    // Validate title
    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    // Validate file existence
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one media file is required",
      });
    }

    // Validate file count
    if (req.files.length > 10) {
      return res.status(400).json({
        success: false,
        message: "Maximum 10 media files allowed per story",
      });
    }

    // Log received files for debugging
    console.log(`Processing ${req.files.length} files for story upload`);

    // Add video size validation logic
    const invalidFiles = req.files.filter((file) => {
      const isVideo = file.mimetype.startsWith("video");
      const isImage = file.mimetype.startsWith("image");

      // Log file details for debugging large uploads
      console.log(
        `Processing file: ${file.originalname}, type: ${
          file.mimetype
        }, size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`
      );

      // For videos, limit to 100MB
      if (isVideo && file.size > 300 * 1024 * 1024) {
        console.log(
          `Video file too large: ${file.originalname}, size: ${(
            file.size /
            (1024 * 1024)
          ).toFixed(2)}MB`
        );
        return true;
      }

      // For images, keep the 20MB limit
      if (isImage && file.size > 20 * 1024 * 1024) {
        console.log(
          `Image file too large: ${file.originalname}, size: ${(
            file.size /
            (1024 * 1024)
          ).toFixed(2)}MB`
        );
        return true;
      }

      return false;
    });

    // Return specific error message for oversized files
    if (invalidFiles.length > 0) {
      const fileNames = invalidFiles.map((f) => f.originalname).join(", ");
      return res.status(400).json({
        success: false,
        message: `Files exceed size limit (20MB for images, 100MB for videos): ${fileNames}`,
      });
    }

    // Map files to media objects
    const media = req.files.map((file) => ({
      mediaType: file.mimetype.startsWith("image") ? "image" : "video",
      mediaUrl: file.path,
      cloudinaryId: file.filename || file.public_id || null,
    }));

    // Set expiration time to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // Create the story
    const story = await Story.create({
      title,
      media,
      expiresAt,
    });

    // Enhanced notification handling
    try {
      // Use dedicated story notification method
      const notificationResult = await notificationService.notifyNewStory(
        story
      );

      console.log("Story notification result:", notificationResult);

      if (!notificationResult.success) {
        console.error(
          "Failed to send story notification:",
          notificationResult.error
        );
      }
    } catch (notifyError) {
      // Log error but don't let it affect the story creation response
      console.error("Notification error during story creation:", notifyError);
    }

    // Return success response
    res.status(201).json({
      success: true,
      data: story,
    });
  } catch (err) {
    // Check for specific error types
    if (err.name === "PayloadTooLargeError") {
      return res.status(413).json({
        success: false,
        message:
          "File size too large. Maximum upload size is 100MB for videos and 20MB for images.",
      });
    }

    // Use the general error handler for other errors
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
            console.error(
              "Error deleting media from Cloudinary:",
              cloudinaryError
            );
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
    console.log("getArchivedStories function called");
    console.log("User ID:", req.user ? req.user.id : "No user in request");

    const archivedStories = await Story.find({ archived: true })
      .sort({ archivedAt: -1 })
      .lean();

    console.log(`Found ${archivedStories.length} archived stories`);

    res.status(200).json({
      success: true,
      count: archivedStories.length,
      data: archivedStories,
    });
  } catch (err) {
    console.error("Error in getArchivedStories:", err);
    res.status(500).json({
      success: false,
      message: "Error retrieving archived stories",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
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
            console.error(
              "Error deleting media from Cloudinary:",
              cloudinaryError
            );
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
