const Post = require("../models/Post");
const Like = require("../models/Like");
const { cloudinary } = require("../config/cloudinary");
const notificationService = require("../services/notificationService");

exports.getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPosts = await Post.countDocuments();

    res.status(200).json({
      success: true,
      count: posts.length,
      total: totalPosts,
      totalPages: Math.ceil(totalPosts / limit),
      currentPage: page,
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

exports.createPost = async (req, res) => {
  try {
    const { caption, content, tags } = req.body;

    let newPost = {
      caption,
      content,
      tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
      media: [],
    };

    if (req.files && req.files.length > 0) {
      let rawFilters = req.body.filters || "[]";
      let filters = [];
      try {
        filters = JSON.parse(req.body.filters);
        if (!Array.isArray(filters)) filters = [];
      } catch (err) {
        console.warn("Invalid filters JSON:", req.body.filters);
        filters = [];
      }

      newPost.media = req.files.map((file, index) => {
        let mediaType = "none";
        if (file.mimetype.startsWith("image")) {
          mediaType = "image";
        } else if (file.mimetype.startsWith("video")) {
          mediaType = "video";
        }

        return {
          mediaType,
          mediaUrl: file.path,
          cloudinaryId: file.filename,
          filter: filters[index] || "",
        };
      });
    }

    const post = await Post.create(newPost);

    notificationService
      .sendCustomNotification(`New post "${caption}" has been added!`, null)
      .catch((error) => {
        console.error("Error sending notifications:", error);
      });

    res.status(201).json({
      success: true,
      data: post,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.updatePost = async (req, res) => {
  try {
    let post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const { caption, content, tags, keepMedia } = req.body;
    const keepMediaIds = keepMedia ? keepMedia.split(",") : [];

    post.caption = caption || post.caption;
    post.content = content || post.content;
    post.tags = tags ? tags.split(",").map((tag) => tag.trim()) : post.tags;
    post.updatedAt = Date.now();

    if (req.files && req.files.length > 0) {
      let updatedMedia = [];

      if (post.media && post.media.length > 0 && keepMediaIds.length > 0) {
        const mediaToKeep = post.media.filter((media) =>
          keepMediaIds.includes(media._id.toString())
        );
        updatedMedia = [...mediaToKeep];
      }
      let rawFilters = req.body.filters || "[]";
      let filters = [];
      try {
        filters = JSON.parse(req.body.filters);
        if (!Array.isArray(filters)) filters = [];
      } catch (err) {
        console.warn("Invalid filters JSON:", req.body.filters);
        filters = [];
      }

      console.log("Filters received:", filters);
      console.log("Files received:", req.files.length);

      const newMedia = req.files.map((file, index) => {
        let mediaType = "none";
        if (file.mimetype.startsWith("image")) {
          mediaType = "image";
        } else if (file.mimetype.startsWith("video")) {
          mediaType = "video";
        }

        return {
          mediaType,
          mediaUrl: file.path,
          cloudinaryId: file.filename,
          filter: filters[index] || "",
        };
      });

      post.media = [...updatedMedia, ...newMedia];

      if (post.media && post.media.length > 0) {
        const mediaToDelete = post.media.filter(
          (media) => !keepMediaIds.includes(media._id.toString())
        );

        for (const media of mediaToDelete) {
          if (media.cloudinaryId) {
            await cloudinary.uploader.destroy(media.cloudinaryId);
          }
        }
      }
    } else if (keepMediaIds.length > 0 && post.media && post.media.length > 0) {
      const mediaToKeep = post.media.filter((media) =>
        keepMediaIds.includes(media._id.toString())
      );

      const mediaToDelete = post.media.filter(
        (media) => !keepMediaIds.includes(media._id.toString())
      );

      for (const media of mediaToDelete) {
        if (media.cloudinaryId) {
          await cloudinary.uploader.destroy(media.cloudinaryId);
        }
      }

      post.media = mediaToKeep;
    } else if (
      keepMediaIds.length === 0 &&
      post.media &&
      post.media.length > 0
    ) {
      for (const media of post.media) {
        if (media.cloudinaryId) {
          await cloudinary.uploader.destroy(media.cloudinaryId);
        }
      }
      post.media = [];
    }

    await post.save();

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
