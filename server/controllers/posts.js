const Post = require("../models/Post");
const { cloudinary } = require("../config/cloudinary");
const {
  notifySubscribersOfNewContent,
} = require("../services/notificationService");

// Get all posts
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

// Get a single post
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

// Create a post
exports.createPost = async (req, res) => {
  try {
    const { caption, content, tags } = req.body;

    // Create new post without media
    let newPost = {
      caption,
      content,
      tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
      media: [],
    };

    // Add media files if uploaded
    if (req.files && req.files.length > 0) {
      // Process each uploaded file
      newPost.media = req.files.map((file) => {
        // Determine media type based on file
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
        };
      });
    }

    const post = await Post.create(newPost);

    // Send notification about new post (async, don't wait for completion)
    notifySubscribersOfNewContent({
      title: caption,
      type: "post",
    }).catch((error) => {
      console.error("Error sending notifications:", error);
      // Don't let notification failures affect post creation response
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

// Update a post
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

    // Update text fields
    post.caption = caption || post.caption;
    post.content = content || post.content;
    post.tags = tags ? tags.split(",").map((tag) => tag.trim()) : post.tags;
    post.updatedAt = Date.now();

    // Handle media updates
    if (req.files && req.files.length > 0) {
      // If we're keeping some existing media
      let updatedMedia = [];

      // Keep the selected existing media
      if (post.media && post.media.length > 0 && keepMediaIds.length > 0) {
        // Filter media items to keep
        const mediaToKeep = post.media.filter((media) =>
          keepMediaIds.includes(media._id.toString())
        );
        updatedMedia = [...mediaToKeep];
      }

      // Add new media files
      const newMedia = req.files.map((file) => {
        // Determine media type
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
        };
      });

      // Combine kept media with new media
      post.media = [...updatedMedia, ...newMedia];

      // Delete removed media from Cloudinary
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
      // If no new files but keeping some existing ones
      // Filter media items to keep
      const mediaToKeep = post.media.filter((media) =>
        keepMediaIds.includes(media._id.toString())
      );

      // Find media items to delete
      const mediaToDelete = post.media.filter(
        (media) => !keepMediaIds.includes(media._id.toString())
      );

      // Delete removed media from Cloudinary
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
      // If keepMediaIds is empty, delete all existing media
      for (const media of post.media) {
        if (media.cloudinaryId) {
          await cloudinary.uploader.destroy(media.cloudinaryId);
        }
      }
      post.media = [];
    }

    // Save updated post
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

// Delete a post
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Delete all media files from Cloudinary
    if (post.media && post.media.length > 0) {
      for (const media of post.media) {
        if (media.cloudinaryId) {
          await cloudinary.uploader.destroy(media.cloudinaryId);
        }
      }
    }

    // Delete post from database
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

// Search posts
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

// Like a post
exports.likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Increment likes count
    post.likes += 1;
    await post.save();

    res.status(200).json({
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
