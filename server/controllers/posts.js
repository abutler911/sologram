const Post = require("../models/Post");
const Like = require("../models/Like");
const { cloudinary } = require("../config/cloudinary");
const notificationService = require("../services/notificationService");

exports.getPosts = async (req, res) => {
  console.log("[DEBUG] getPosts controller hit");
  console.log("[POSTS] Fetching posts...");
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPosts = await Post.countDocuments();

    console.log(`[POSTS] Found ${posts.length} posts out of ${totalPosts}`);

    res.status(200).json({
      success: true,
      count: posts.length,
      total: totalPosts,
      totalPages: Math.ceil(totalPosts / limit),
      currentPage: page,
      data: posts,
    });
  } catch (err) {
    console.error("[POSTS ERROR]", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: err.message,
    });
  }
};

exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    res.status(200).json({
      success: true,
      data: post,
    });
  } catch (err) {
    console.error(err);

    if (err.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// In server/controllers/posts.js - Update the createPost function

exports.createPost = async (req, res) => {
  try {
    let { caption, content, tags, media = [] } = req.body;

    // Defensive: handle media if it comes as a JSON string
    if (typeof media === "string") {
      try {
        media = JSON.parse(media);
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: "Invalid media format. Must be a valid JSON array.",
        });
      }
    }

    if (!caption || !Array.isArray(media)) {
      return res.status(400).json({
        success: false,
        message: "Caption and media are required",
      });
    }

    // Validate media items
    const formattedMedia = media.map((item) => {
      if (!item.mediaUrl || !item.cloudinaryId) {
        throw new Error(
          "Each media item must include mediaUrl and cloudinaryId"
        );
      }

      return {
        mediaType: item.mediaType || "image",
        mediaUrl: item.mediaUrl,
        cloudinaryId: item.cloudinaryId,
        filter: item.filter || "",
        uploadedAt: new Date(),
      };
    });

    const newPost = await Post.create({
      caption,
      content,
      tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
      media: formattedMedia,
    });

    // Enhanced notification handling
    try {
      // Use the dedicated new post notification method
      const notificationService = require("../services/notificationService");
      const notificationResult = await notificationService.notifyNewPost(
        newPost
      );

      // Log notification result but don't block the response
      console.log("Notification result:", notificationResult);

      // If notification failed, log error but continue
      if (!notificationResult.success) {
        console.error(
          "Failed to send post notification:",
          notificationResult.error
        );
      }
    } catch (notifyError) {
      // Log error but don't let it affect the post creation response
      console.error("Notification error during post creation:", notifyError);
    }

    res.status(201).json({ success: true, data: newPost });
  } catch (err) {
    console.error("Post creation failed:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    let { caption, content, tags, media = [], keepMedia = [] } = req.body;

    // Handle possible stringified media
    if (typeof media === "string") {
      try {
        media = JSON.parse(media);
      } catch {
        return res
          .status(400)
          .json({ success: false, message: "Invalid media JSON" });
      }
    }

    // Handle possible stringified keepMedia
    const keepMediaIds = Array.isArray(keepMedia)
      ? keepMedia.map((id) => id.toString().trim())
      : keepMedia.split(",").map((id) => id.trim());

    const keptMedia = post.media.filter((m) =>
      keepMediaIds.includes(m._id.toString())
    );

    const removedMedia = post.media.filter(
      (m) => !keepMediaIds.includes(m._id.toString())
    );

    // Delete media from Cloudinary
    for (const media of removedMedia) {
      if (media.cloudinaryId) {
        try {
          await cloudinary.uploader.destroy(media.cloudinaryId);
        } catch (err) {
          console.warn(
            "Failed to delete Cloudinary asset:",
            media.cloudinaryId,
            err
          );
        }
      }
    }

    const keptMediaCloudinaryIds = keptMedia.map((m) => m.cloudinaryId);

    const newMedia = Array.isArray(media)
      ? media
          .filter((item) => {
            return (
              item.cloudinaryId &&
              !keptMediaCloudinaryIds.includes(item.cloudinaryId)
            );
          })
          .map((item) => {
            if (!item.mediaUrl || !item.cloudinaryId) {
              throw new Error(
                "Each new media item must have mediaUrl and cloudinaryId"
              );
            }

            return {
              mediaType: item.mediaType || "image",
              mediaUrl: item.mediaUrl,
              cloudinaryId: item.cloudinaryId,
              filter: item.filter || "",
              uploadedAt: new Date(),
            };
          })
      : [];

    // Update post fields
    post.caption = caption || post.caption;
    post.content = content || post.content;
    post.tags = tags ? tags.split(",").map((tag) => tag.trim()) : post.tags;
    post.media = [...keptMedia, ...newMedia];
    post.updatedAt = Date.now();

    await post.save();

    res.status(200).json({ success: true, data: post });
  } catch (err) {
    console.error("Post update failed:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (post.media && post.media.length > 0) {
      for (const media of post.media) {
        if (media.cloudinaryId) {
          await cloudinary.uploader.destroy(media.cloudinaryId);
        }
      }
    }

    await post.deleteOne();

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (err) {
    console.error(err);

    if (err.kind === "ObjectId") {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.searchPosts = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const posts = await Post.find({ $text: { $search: query } }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: posts.length,
      data: posts,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.likePost = async (req, res) => {
  try {
    const postId = req.params.id;

    // More robust IP detection
    const userIp =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      req.ip;

    console.log(`Like attempt - Post: ${postId}, IP: ${userIp}`);

    const mongoose = require("mongoose"); // Add this if not already at the top
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Use the session for all database operations
      const post = await Post.findById(postId).session(session);

      if (!post) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }

      // Explicit query with session
      const existingLike = await Like.findOne({
        post: postId,
        ip: userIp,
      }).session(session);

      console.log(`Existing like found: ${!!existingLike}`);

      if (existingLike) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: "You have already liked this post",
        });
      }

      // Create like with session
      await Like.create([{ post: postId, ip: userIp }], { session });

      // Update post with session
      post.likes += 1;
      await post.save({ session });

      await session.commitTransaction();
      session.endSession();

      res.status(200).json({
        success: true,
        data: post,
      });
    } catch (err) {
      // If any error occurs, abort the transaction
      await session.abortTransaction();
      session.endSession();
      throw err; // rethrow to outer catch
    }
  } catch (err) {
    console.error("Like error:", err);

    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You have already liked this post",
      });
    }

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
