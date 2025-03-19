const mongoose = require("mongoose");
const Story = require("../models/Story");
const {
  notifySubscribersOfNewContent,
} = require("../services/notificationService");

const handleServerError = (res, err, customMessage = "Server Error") => {
  console.error("Detailed error:", {
    message: err.message,
    stack: err.stack,
    name: err.name,
    customMessage,
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
  const now = new Date();
  const result = await Story.updateMany(
    {
      archived: false,
      expiresAt: { $lt: now },
    },
    {
      $set: {
        archived: true,
        archivedAt: now,
      },
    }
  );

  console.log(`Automatically archived ${result.modifiedCount} expired stories`);
  return result;
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
        message: "Invalid story ID",
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

    const media = req.files.map((file) => ({
      mediaType: file.mimetype.startsWith("image") ? "image" : "video",
      mediaUrl: file.path,
    }));

    if (media.length > 10) {
      return res.status(400).json({
        success: false,
        message: "Maximum 10 media files allowed",
      });
    }

    const validMediaTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "video/mp4",
      "video/quicktime",
    ];
    const invalidMedia = req.files.some(
      (file) => !validMediaTypes.includes(file.mimetype)
    );

    if (invalidMedia) {
      return res.status(400).json({
        success: false,
        message: "Invalid media type. Allowed types: JPEG, PNG, GIF, MP4, MOV",
      });
    }

    const story = await Story.create({
      title,
      media,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    try {
      await notifySubscribersOfNewContent({
        title,
        type: "story",
      });
    } catch (notifyError) {
      console.error("Notification error:", notifyError);
    }

    res.status(201).json({
      success: true,
      data: story,
    });
  } catch (err) {
    handleServerError(res, err, "Error creating story");
  }
};

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
    handleServerError(res, err, "Error deleting story");
  }
};

exports.getArchivedStories = async (req, res) => {
  try {
    console.log("getArchivedStories function called");

    // Skip the automatic archiving if it's causing issues
    // await checkAndArchiveExpiredStories();

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    console.log(
      `Querying for archived stories with pagination: page=${page}, limit=${limit}`
    );

    // Explicitly find stories where archived is true
    const archivedStories = await Story.find({ archived: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Story.countDocuments({ archived: true });

    console.log(
      `Found ${archivedStories.length} archived stories out of ${total} total`
    );

    res.status(200).json({
      success: true,
      count: archivedStories.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
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

exports.getArchivedStory = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`getArchivedStory function called with ID: ${id}`);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error(`Invalid ObjectId: ${id}`);
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }

    // Look for a story that has both the matching ID AND is archived
    const story = await Story.findOne({
      _id: id,
      archived: true,
    });

    if (!story) {
      console.log(`No archived story found with ID: ${id}`);
      return res.status(404).json({
        success: false,
        message: "Archived story not found",
      });
    }

    console.log(`Successfully found archived story with ID: ${id}`);
    res.status(200).json({
      success: true,
      data: story,
    });
  } catch (err) {
    console.error(`Error in getArchivedStory with ID ${req.params.id}:`, err);
    res.status(500).json({
      success: false,
      message: "Error retrieving archived story",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

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
    story.archivedAt = new Date();
    await story.save();
    res.status(200).json({
      success: true,
      data: story,
    });
  } catch (err) {
    handleServerError(res, err, "Error archiving story");
  }
};

exports.deleteArchivedStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    // Relaxing this restriction - allow deleting any story from the archived endpoint
    // if (!story.archived) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Story must be archived before it can be deleted",
    //   });
    // }

    await story.deleteOne();
    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    handleServerError(res, err, "Error deleting archived story");
  }
};
