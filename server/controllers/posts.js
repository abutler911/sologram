const Post = require('../models/Post');
const Like = require('../models/Like');
const Comment = require('../models/Comment');
const { cloudinary } = require('../config/cloudinary');
const { sendEmail } = require('../utils/sendEmail');
const { notifyFamilySms } = require('../services/notify/notifyFamilySms');
const {
  noonUTCFromInputDateStr,
  todayNoonUTC,
} = require('../utils/dateHelpers');
const User = require('../models/User');
const {
  buildNewPostEmail,
} = require('../utils/emailTemplates/newPostTemplate');

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Given an array of lean post objects, attach the real like count from
 * the Like collection via a single aggregation.
 */
async function attachLikeCounts(posts) {
  if (!posts.length) return posts;
  const ids = posts.map((p) => p._id);
  const agg = await Like.aggregate([
    { $match: { post: { $in: ids } } },
    { $group: { _id: '$post', count: { $sum: 1 } } },
  ]);
  const map = Object.fromEntries(agg.map((r) => [r._id.toString(), r.count]));
  return posts.map((p) => ({
    ...p,
    likes: map[p._id.toString()] ?? p.likes ?? 0,
  }));
}

/**
 * Attach live comment counts (top-level + replies) from Comment collection.
 * One aggregation for all posts — never trusts stale Post.commentCount.
 */
async function attachCommentCounts(posts) {
  if (!posts.length) return posts;
  const ids = posts.map((p) => p._id);
  const agg = await Comment.aggregate([
    { $match: { postId: { $in: ids }, isDeleted: false } },
    { $group: { _id: '$postId', count: { $sum: 1 } } },
  ]);
  const map = Object.fromEntries(agg.map((r) => [r._id.toString(), r.count]));
  return posts.map((p) => ({ ...p, commentCount: map[p._id.toString()] ?? 0 }));
}

// ─── Controllers ────────────────────────────────────────────────────────────

exports.getPosts = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit, 10) || 10)
    );
    const skip = (page - 1) * limit;

    const [total, posts] = await Promise.all([
      Post.countDocuments(),
      Post.find().sort({ eventDate: -1 }).skip(skip).limit(limit).lean(),
    ]);

    const withLikes = await attachLikeCounts(posts);
    const data = await attachCommentCounts(withLikes);

    res.json({
      success: true,
      count: data.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data,
    });
  } catch (err) {
    console.error('[getPosts]', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).lean();
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: 'Post not found' });

    // Always return accurate like count for single-post view
    const [result] = await attachLikeCounts([post]);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[getPost]', err);
    const status = err.name === 'CastError' ? 404 : 500;
    res.status(status).json({
      success: false,
      message: status === 404 ? 'Post not found' : 'Server Error',
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

    if (typeof media === 'string') {
      try {
        media = JSON.parse(media);
      } catch {
        return res
          .status(400)
          .json({ success: false, message: 'Invalid media JSON' });
      }
    }

    if (!title || !caption || !Array.isArray(media)) {
      return res.status(400).json({
        success: false,
        message: 'title, caption, and media are required',
      });
    }

    const formattedMedia = media.map((item) => {
      if (!item.mediaUrl || !item.cloudinaryId)
        throw new Error('Each media item needs mediaUrl and cloudinaryId');
      return {
        mediaType: item.mediaType || 'image',
        mediaUrl: item.mediaUrl,
        cloudinaryId: item.cloudinaryId,
        filter: item.filter || '',
      };
    });

    const eventDate = date ? noonUTCFromInputDateStr(date) : todayNoonUTC();

    const newPost = await Post.create({
      title,
      caption,
      content,
      location,
      media: formattedMedia,
      tags: tags
        ? tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      eventDate,
    });

    const postUrl = `${process.env.APP_PUBLIC_URL || 'https://thesologram.com'}/l/${newPost._id}`;

    // Fire-and-forget notifications — don't block the response
    notifyFamilySms('post', { title: newPost.title, url: postUrl }).catch((e) =>
      console.error('[SMS]', e?.message || e)
    );

    User.find({}, 'email')
      .lean()
      .then((users) =>
        Promise.allSettled(
          users.map((u) =>
            sendEmail({
              to: u.email,
              subject: `📸 New SoloGram Post: ${newPost.title}`,
              html: buildNewPostEmail({
                title: newPost.title,
                caption: newPost.caption,
                content: newPost.content,
                postId: newPost._id.toString(),
              }),
            })
          )
        ).then((results) => {
          const sent = results.filter((r) => r.status === 'fulfilled').length;
          console.log(`✅ Emails sent: ${sent}/${users.length}`);
        })
      )
      .catch((e) => console.error('[Email]', e));

    res.status(201).json({ success: true, data: newPost });
  } catch (err) {
    console.error('[createPost]', err);
    res
      .status(500)
      .json({ success: false, message: err.message || 'Server Error' });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: 'Post not found' });

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

    if (typeof media === 'string') {
      try {
        media = JSON.parse(media);
      } catch {
        return res
          .status(400)
          .json({ success: false, message: 'Invalid media JSON' });
      }
    }

    const keepIds = (
      Array.isArray(keepMedia) ? keepMedia : keepMedia.split(',')
    ).map((id) => id.toString().trim());

    const keptMedia = post.media.filter((m) =>
      keepIds.includes(m._id.toString())
    );
    const removedMedia = post.media.filter(
      (m) => !keepIds.includes(m._id.toString())
    );

    // Delete removed assets from Cloudinary (fire-and-forget, don't block save)
    Promise.allSettled(
      removedMedia
        .filter((m) => m.cloudinaryId)
        .map((m) => cloudinary.uploader.destroy(m.cloudinaryId))
    ).catch((e) => console.error('[Cloudinary cleanup]', e));

    const keptCloudinaryIds = new Set(keptMedia.map((m) => m.cloudinaryId));
    const newMedia = (Array.isArray(media) ? media : [])
      .filter(
        (item) => item.cloudinaryId && !keptCloudinaryIds.has(item.cloudinaryId)
      )
      .map((item) => {
        if (!item.mediaUrl || !item.cloudinaryId)
          throw new Error('Each media item needs mediaUrl and cloudinaryId');
        return {
          mediaType: item.mediaType || 'image',
          mediaUrl: item.mediaUrl,
          cloudinaryId: item.cloudinaryId,
          filter: item.filter || '',
        };
      });

    if (title !== undefined) post.title = title;
    if (caption !== undefined) post.caption = caption;
    if (content !== undefined) post.content = content;
    if (location !== undefined) post.location = location;
    if (tags !== undefined)
      post.tags = tags
        ? tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [];
    if (date) {
      const safe = noonUTCFromInputDateStr(date);
      if (safe) {
        post.eventDate = safe;
        post.createdAt = safe;
      }
    }

    post.media = [...keptMedia, ...newMedia];
    await post.save();

    res.json({ success: true, data: post });
  } catch (err) {
    console.error('[updatePost]', err);
    res
      .status(500)
      .json({ success: false, message: err.message || 'Server Error' });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: 'Post not found' });

    // Delete all media assets from Cloudinary
    await Promise.allSettled(
      (post.media || [])
        .filter((m) => m.cloudinaryId)
        .map((m) => cloudinary.uploader.destroy(m.cloudinaryId))
    );

    await post.deleteOne();
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    console.error('[deletePost]', err);
    const status = err.name === 'CastError' ? 404 : 500;
    res.status(status).json({
      success: false,
      message: status === 404 ? 'Post not found' : 'Server Error',
    });
  }
};

exports.searchPosts = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query?.trim())
      return res
        .status(400)
        .json({ success: false, message: 'Search query is required' });

    const posts = await Post.find({ $text: { $search: query } })
      .sort({ score: { $meta: 'textScore' } })
      .limit(50)
      .lean();

    const withLikes = await attachLikeCounts(posts);
    const data = await attachCommentCounts(withLikes);
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    console.error('[searchPosts]', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

/**
 * Like a post — one like per user, not toggleable (Instagram-style).
 * Uses atomic $inc + Like upsert — no session/transaction needed.
 */
exports.likePost = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.user._id;

    // Atomic upsert: if like already exists, this is a no-op
    const result = await Like.updateOne(
      { post: postId, user: userId },
      { $setOnInsert: { post: postId, user: userId } },
      { upsert: true }
    );

    const alreadyLiked = result.upsertedCount === 0;

    // Only increment denormalized count on first like
    if (!alreadyLiked) {
      await Post.updateOne({ _id: postId }, { $inc: { likes: 1 } });
    }

    const post = await Post.findById(postId).lean();
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: 'Post not found' });

    res.json({ success: true, alreadyLiked, data: post });
  } catch (err) {
    console.error('[likePost]', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.checkUserLike = async (req, res) => {
  try {
    const like = await Like.exists({ post: req.params.id, user: req.user._id });
    res.json({ success: true, hasLiked: !!like });
  } catch (err) {
    console.error('[checkUserLike]', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.checkUserLikesBatch = async (req, res) => {
  try {
    const { postIds } = req.body;
    if (!Array.isArray(postIds) || !postIds.length) {
      return res
        .status(400)
        .json({ success: false, message: 'postIds array required' });
    }

    const likes = await Like.find({
      post: { $in: postIds },
      user: req.user._id,
    })
      .select('post')
      .lean();
    const likedSet = new Set(likes.map((l) => l.post.toString()));

    res.json({
      success: true,
      results: postIds.map((id) => ({
        postId: id,
        hasLiked: likedSet.has(id.toString()),
      })),
    });
  } catch (err) {
    console.error('[checkUserLikesBatch]', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }

  exports.deleteMedia = async (req, res) => {
    try {
      const publicId = decodeURIComponent(req.params.cloudinaryId);

      if (!publicId || typeof publicId !== 'string') {
        return res
          .status(400)
          .json({ success: false, message: 'cloudinaryId is required' });
      }

      // Safety: only allow deletion within the app's upload folder
      const allowedFolder = process.env.CLOUDINARY_BASE_FOLDER || 'sologram';
      if (!publicId.startsWith(allowedFolder + '/')) {
        return res.status(403).json({
          success: false,
          message: 'Cannot delete assets outside app folder',
        });
      }

      const result = await cloudinary.uploader.destroy(publicId);

      res.json({
        success: true,
        result: result.result, // 'ok' | 'not found'
      });
    } catch (err) {
      console.error('[deleteMedia]', err);
      // Best-effort — don't fail the client experience over cleanup
      res.status(500).json({ success: false, message: 'Cleanup failed' });
    }
  };
};
