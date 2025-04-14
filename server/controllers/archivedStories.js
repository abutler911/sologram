const mongoose = require("mongoose");
const Story = require("../models/Story");
const cloudinary = require("../config/cloudinary").cloudinary;

const handleServerError = (res, err, customMessage = "Server Error") => {
  res.status(500).json({
    success: false,
    message: customMessage,
    ...(process.env.NODE_ENV === "development" && {
      error: err.message,
      stack: err.stack,
    }),
  });
};

exports.getArchivedStories = async (req, res) => {
  try {
    const archivedStories = await Story.find({ archived: true })
      .sort({ archivedAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: archivedStories.length,
      data: archivedStories,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error retrieving archived stories",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

exports.getArchivedStory = async (req, res) => {
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

    if (!story.archived) {
      return res.status(400).json({
        success: false,
        message: "Only archived stories can be deleted from the archive",
      });
    }

    // 🔐 Authorization check: only creator or admin can delete
    if (
      req.user.role !== "admin" &&
      story.createdBy.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this story",
      });
    }

    // Optional: Delete from Cloudinary
    if (story.media && story.media.length > 0) {
      for (const media of story.media) {
        if (media.cloudinaryId) {
          try {
            await cloudinary.uploader.destroy(media.cloudinaryId);
          } catch (cloudinaryError) {
            console.warn(
              `Failed to delete from Cloudinary: ${media.cloudinaryId}`
            );
            // Don’t stop the delete process over Cloudinary errors
          }
        }
      }
    }

    await story.deleteOne();

    res.status(200).json({
      success: true,
      message: "Archived story deleted successfully",
    });
  } catch (err) {
    handleServerError(res, err, "Error deleting archived story");
  }
};
