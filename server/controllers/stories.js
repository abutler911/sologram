const mongoose = require("mongoose");
const Story = require("../models/Story");
const cloudinary = require("../config/cloudinary").cloudinary;
const {
  buildStoryEmail,
} = require("../utils/emailTemplates/storyPostedTemplate");
const { sendEmail } = require("../utils/sendEmail");
const User = require("../models/User");

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

exports.getStories = async (req, res) => {
  try {
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

    const invalidFiles = req.files.filter((file) => {
      const isVideo = file.mimetype.startsWith("video");
      const isImage = file.mimetype.startsWith("image");

      if (isVideo && file.size > 300 * 1024 * 1024) {
        return true;
      }

      if (isImage && file.size > 20 * 1024 * 1024) {
        return true;
      }

      return false;
    });

    if (invalidFiles.length > 0) {
      const fileNames = invalidFiles.map((f) => f.originalname).join(", ");
      return res.status(400).json({
        success: false,
        message: `Files exceed size limit (20MB for images, 100MB for videos): ${fileNames}`,
      });
    }

    const media = req.files.map((file) => ({
      mediaType: file.mimetype.startsWith("image") ? "image" : "video",
      mediaUrl: file.path,
      cloudinaryId: file.filename || file.public_id || null,
    }));

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const story = await Story.create({
      title,
      media,
      expiresAt,
    });
    const users = await User.find({});

    for (const user of users) {
      await sendEmail({
        to: user.email,
        subject: `[SoloGram] 📖 New Story: ${story.title}`,
        html: buildStoryEmail({
          title: story.title,
          description: story.description || "",
          storyId: story._id.toString(),
        }),
      });
    }
    res.status(201).json({
      success: true,
      data: story,
    });
  } catch (err) {
    if (err.name === "PayloadTooLargeError") {
      return res.status(413).json({
        success: false,
        message:
          "File size too large. Maximum upload size is 100MB for videos and 20MB for images.",
      });
    }

    handleServerError(res, err, "Error creating story");
  }
};

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
    handleServerError(res, err, "Error retrieving archived stories");
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
