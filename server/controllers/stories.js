const Story = require("../models/Story");
const { deleteFile, getKeyFromUrl } = require("../config/s3");

// Create a story (admin only)
exports.createStory = async (req, res) => {
  try {
    // Process uploaded media
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please upload at least one media file",
      });
    }

    const media = req.files.map((file) => {
      let mediaType = file.mimetype.startsWith("image") ? "image" : "video";
      const mediaUrl = process.env.CLOUDFRONT_DOMAIN
        ? `https://${process.env.CLOUDFRONT_DOMAIN}/${file.key}`
        : file.location;

      return {
        mediaType,
        mediaUrl,
        s3Key: file.key,
      };
    });

    const story = await Story.create({
      user: req.user.id,
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

// Get stories for the feed (public)
exports.getFeedStories = async (req, res) => {
  try {
    // Get stories from the past 24 hours
    const stories = await Story.find({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }).populate("user", "username profileImage");

    res.status(200).json({
      success: true,
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

// Get stories for a specific user (public)
exports.getUserStories = async (req, res) => {
  try {
    const userId = req.params.userId;

    const stories = await Story.find({
      user: userId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    res.status(200).json({
      success: true,
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

// Increment view count (public)
exports.viewStory = async (req, res) => {
  try {
    const story = await Story.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    );

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

// Delete a story (admin only)
exports.deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found",
      });
    }

    // Delete all media files from S3
    if (story.media && story.media.length > 0) {
      for (const media of story.media) {
        if (media.s3Key) {
          await deleteFile(media.s3Key);
        } else if (media.mediaUrl) {
          // Try to extract key from URL
          const key = getKeyFromUrl(media.mediaUrl);
          if (key) await deleteFile(key);
        }
      }
    }

    // Delete story from database
    await story.deleteOne();

    res.status(200).json({
      success: true,
      message: "Story deleted successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
