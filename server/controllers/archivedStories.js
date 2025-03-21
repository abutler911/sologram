// controllers/archivedStories.js
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

// @desc    Get all archived stories
// @route   GET /api/archived-stories
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
// @route   GET /api/archived-stories/:id
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
// @route   DELETE /api/archived-stories/:id
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