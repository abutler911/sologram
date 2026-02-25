const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
  likePost,
  checkUserLike,
  searchPosts,
  checkUserLikesBatch,
} = require('../controllers/posts');

const { protect } = require('../middleware/auth');
const optionalAuth = require('../middleware/optionalAuth');
const { postCreationLimiter } = require('../middleware/rateLimiter');

const Comment = require('../models/Comment');
const Post = require('../models/Post');

// ─── Helpers ────────────────────────────────────────────────────────────────

const isValidId = (id) => mongoose.isValidObjectId(id);

// Strip HTML without requiring sanitize-html
const clean = (s = '') =>
  String(s)
    .replace(/<[^>]*>/g, '')
    .trim();

const safeAuthor = (a) =>
  a
    ? {
        _id: a._id,
        name:
          [a.firstName, a.lastName].filter(Boolean).join(' ') ||
          a.username ||
          'Unknown',
        username: a.username || '',
        avatar: a.profileImage || null,
      }
    : { _id: null, name: 'Unknown', username: '', avatar: null };

const fmt = (c, uid) => ({
  ...c,
  author: safeAuthor(c.author),
  hasLiked: uid ? (c.likes || []).some((id) => id.toString() === uid) : false,
  likes: Array.isArray(c.likes) ? c.likes.length : 0,
  replyCount: Array.isArray(c.replies) ? c.replies.length : 0,
});

const commentLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  keyGenerator: (req) => req.user?.id || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── SPECIFIC ROUTES — must come before /:id param catch-all ────────────────

router.get('/search', searchPosts);
router.post('/likes/check-batch', protect, checkUserLikesBatch);

// GET /api/posts/:postId/comments/count
router.get('/:postId/comments/count', async (req, res) => {
  try {
    const { postId } = req.params;
    if (!isValidId(postId))
      return res
        .status(400)
        .json({ success: false, message: 'Invalid post ID' });
    const count = await Comment.countDocuments({ postId, isDeleted: false });
    res.json({ success: true, count });
  } catch (e) {
    console.error('[comment count]', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/posts/:postId/comments
router.get('/:postId/comments', optionalAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    if (!isValidId(postId))
      return res
        .status(400)
        .json({ success: false, message: 'Invalid post ID' });

    const postExists = await Post.exists({ _id: postId });
    if (!postExists)
      return res
        .status(404)
        .json({ success: false, message: 'Post not found' });

    const page = Math.max(1, parseInt(req.query.page || 1, 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit || 50, 10))
    );

    const [total, items] = await Promise.all([
      Comment.countDocuments({ postId, isDeleted: false }), // ALL comments incl. replies for accurate badge count
      Comment.find({ postId, parentId: null, isDeleted: false })
        .populate('author', 'firstName lastName username profileImage')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    const uid = req.user?.id?.toString();
    res.json({
      success: true,
      comments: items.map((c) => fmt(c, uid)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (e) {
    console.error('[getComments]', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/posts/:postId/comments
router.post('/:postId/comments', protect, commentLimiter, async (req, res) => {
  try {
    const { postId } = req.params;
    const { text, parentId } = req.body;
    const userId = req.user.id;

    if (!isValidId(postId))
      return res
        .status(400)
        .json({ success: false, message: 'Invalid post ID' });

    const safeText = clean(text);
    if (!safeText)
      return res
        .status(400)
        .json({ success: false, message: 'Comment text required' });
    if (safeText.length > 500)
      return res
        .status(400)
        .json({ success: false, message: 'Comment too long (max 500)' });

    const post = await Post.findById(postId).select('_id');
    if (!post)
      return res
        .status(404)
        .json({ success: false, message: 'Post not found' });

    let parent = null;
    if (parentId) {
      if (!isValidId(parentId))
        return res
          .status(400)
          .json({ success: false, message: 'Invalid parent ID' });
      parent = await Comment.findById(parentId)
        .select('_id postId parentId')
        .lean();
      if (!parent || parent.postId.toString() !== postId)
        return res
          .status(400)
          .json({ success: false, message: 'Invalid parent comment' });
      if (parent.parentId)
        return res
          .status(400)
          .json({ success: false, message: 'Only one-level replies allowed' });
    }

    const comment = await Comment.create({
      text: safeText,
      author: userId,
      postId,
      parentId: parent ? parent._id : null,
    });

    await Post.updateOne({ _id: postId }, { $inc: { commentCount: 1 } });
    if (parent) {
      await Comment.updateOne(
        { _id: parent._id },
        { $push: { replies: comment._id } }
      );
    }

    await comment.populate(
      'author',
      'firstName lastName username profileImage'
    );

    res.status(201).json({
      success: true,
      comment: fmt(comment.toObject(), userId),
    });
  } catch (e) {
    console.error('[createComment]', e);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── STANDARD POST ROUTES ────────────────────────────────────────────────────

router.get('/', getPosts);
router.get('/:id', getPost);

router.post('/', protect, postCreationLimiter, createPost);
router.put('/:id', protect, updatePost);
router.delete('/:id', protect, deletePost);

router.post('/:id/like', protect, likePost);
router.get('/:id/likes/check', protect, checkUserLike);

module.exports = router;
