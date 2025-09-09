const Post = require("../models/Post");
const Like = require("../models/Like");
const { cloudinary } = require("../config/cloudinary");
const { sendEmail } = require("../utils/sendEmail");
const { notifyFamilySms } = require("../services/notify/notifyFamilySms");

const User = require("../models/User");
const {
  buildNewPostEmail,
} = require("../utils/emailTemplates/newPostTemplate");

exports.getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalPosts = await Post.countDocuments();

    const posts = await Post.find()
      .sort({ eventDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const postIds = posts.map((post) => post._id);

    let likesMap = {};

    if (postIds.length > 0) {
      const likes = await Like.aggregate([
        { $match: { post: { $in: postIds } } },
        { $group: { _id: "$post", count: { $sum: 1 } } },
      ]);

      likesMap = likes.reduce((acc, like) => {
        acc[like._id.toString()] = like.count;
        return acc;
      }, {});
    }

    const postsWithLikes = posts.map((post) => ({
      ...post,
      likes: likesMap[post._id.toString()] || 0,
    }));

    res.status(200).json({
      success: true,
      count: postsWithLikes.length,
      total: totalPosts,
      totalPages: Math.ceil(totalPosts / limit),
      currentPage: page,
      data: postsWithLikes,
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

exports.createPost = async (req, res) => {
  try {
    let {
      title,
      caption,
      content,
      tags,
      location,
      date,
      media = [],
    } = req.body;

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

    if (!title || !caption || !Array.isArray(media)) {
      return res.status(400).json({
        success: false,
        message: "Title, caption, and media are required",
      });
    }

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

    const eventDate = date ? new Date(date) : new Date();

    const postData = {
      title,
      caption,
      content,
      location,
      media: formattedMedia,
      tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
      eventDate,
      createdAt: eventDate,
      postedAt: new Date(),
      updatedAt: new Date(),
    };

    const newPost = await Post.create(postData);

    const postUrl = `${
      process.env.APP_PUBLIC_URL || "https://thesologram.com"
    }/l/${newPost._id}`;

    notifyFamilySms("post", { title: newPost.title, url: postUrl })
      .then((out) =>
        console.table(
          out.map(
            ({ name, phone, success, textId, error, firstAttemptHadLink }) => ({
              name,
              phone,
              success,
              textId,
              error,
              firstAttemptHadLink,
            })
          )
        )
      )
      .catch((e) => console.error("[SMS notify error]", e?.message || e));

    try {
      const users = await User.find({});

      for (const user of users) {
        await sendEmail({
          to: user.email,
          subject: `📸 New SoloGram Post: ${newPost.title}`,
          html: buildNewPostEmail({
            title: newPost.title,
            caption: newPost.caption,
            content: newPost.content,
            postId: newPost._id.toString(),
          }),
        });
      }

      console.log(`✅ Sent notifications to ${users.length} users.`);
    } catch (emailErr) {
      console.error(
        "❌ Email notification error:",
        JSON.stringify(emailErr, null, 2)
      );
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

    let {
      title,
      caption,
      content,
      tags,
      location,
      date,
      media = [],
      keepMedia = [],
    } = req.body;

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

    const keepMediaIds = Array.isArray(keepMedia)
      ? keepMedia.map((id) => id.toString().trim())
      : keepMedia.split(",").map((id) => id.trim());

    const keptMedia = post.media.filter((m) =>
      keepMediaIds.includes(m._id.toString())
    );

    const removedMedia = post.media.filter(
      (m) => !keepMediaIds.includes(m._id.toString())
    );

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
          .filter(
            (item) =>
              item.cloudinaryId &&
              !keptMediaCloudinaryIds.includes(item.cloudinaryId)
          )
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
    if (typeof title !== "undefined") post.title = title;
    if (typeof caption !== "undefined") post.caption = caption;
    if (typeof content !== "undefined") post.content = content;
    if (typeof location !== "undefined") post.location = location;
    if (typeof tags !== "undefined") {
      post.tags = tags ? tags.split(",").map((tag) => tag.trim()) : [];
    }

    post.media = [...keptMedia, ...newMedia];
    post.updatedAt = new Date();

    if (date) {
      const eventDate = new Date(date);
      post.eventDate = eventDate;
      post.createdAt = eventDate; // for feed sorting
    }

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
    const userId = req.user._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required to like posts",
      });
    }

    console.log(`Like attempt - Post: ${postId}, User: ${userId}`);

    const session = await Like.startSession();
    session.startTransaction();

    try {
      const post = await Post.findById(postId).session(session);
      if (!post) {
        throw new Error("Post not found");
      }

      // Check if the user already liked this post
      const existingLike = await Like.findOne({
        post: postId,
        user: userId,
      }).session(session);

      if (existingLike) {
        throw new Error("You have already liked this post");
      }

      // Create a new like
      await Like.create([{ post: postId, user: userId }], { session });

      // Increment the like count on the Post
      post.likes += 1;
      await post.save({ session });

      await session.commitTransaction();
      session.endSession();

      res.status(200).json({
        success: true,
        data: post,
      });
    } catch (err) {
      await session.abortTransaction();
      session.endSession();

      if (err.message === "You have already liked this post") {
        // Return success for duplicate like attempts
        const post = await Post.findById(postId);
        return res.status(200).json({
          success: true,
          message: "Post already liked",
          data: post,
        });
      }

      throw err;
    }
  } catch (err) {
    console.error("Like error:", err.message || err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.checkUserLike = async (req, res) => {
  try {
    const { id: postId } = req.params;
    const userId = req.user._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const like = await Like.findOne({ post: postId, user: userId });

    res.status(200).json({
      success: true,
      hasLiked: !!like,
    });
  } catch (err) {
    console.error("Check like error:", err.message || err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

exports.checkUserLikesBatch = async (req, res) => {
  try {
    const { postIds } = req.body;
    const userId = req.user._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!Array.isArray(postIds) || postIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid or empty post IDs array",
      });
    }

    const likes = await Like.find({
      post: { $in: postIds },
      user: userId,
    });

    const results = postIds.map((postId) => ({
      postId,
      hasLiked: likes.some(
        (like) => like.post.toString() === postId.toString()
      ),
    }));

    res.status(200).json({
      success: true,
      results,
    });
  } catch (err) {
    console.error("Batch check likes error:", err.message || err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
