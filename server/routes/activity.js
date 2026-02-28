// routes/activity.js
// Public endpoint — returns recent posts + thoughts since a given timestamp.
// No auth required. Powers the "What's New" banner on the client.

const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Thought = require('../models/Thought');

router.get('/recent', async (req, res) => {
  try {
    const since = req.query.since
      ? new Date(parseInt(req.query.since, 10))
      : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // default: last 7 days

    // Don't allow absurdly old queries
    const floor = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const sinceDate = since < floor ? floor : since;

    const [posts, thoughts] = await Promise.all([
      Post.find({ createdAt: { $gt: sinceDate } })
        .sort({ createdAt: -1 })
        .limit(20)
        .select('title caption tags eventDate createdAt media')
        .lean(),
      Thought.find({ createdAt: { $gt: sinceDate } })
        .sort({ createdAt: -1 })
        .limit(20)
        .select('content mood tags createdAt')
        .lean(),
    ]);

    // Attach a thumbnail if the post has media
    const postsWithThumb = posts.map((p) => ({
      ...p,
      thumbnail: p.media?.[0]?.mediaUrl || null,
      media: undefined,
    }));

    res.status(200).json({
      success: true,
      data: {
        postCount: posts.length,
        thoughtCount: thoughts.length,
        posts: postsWithThumb,
        thoughts,
        since: sinceDate.getTime(),
      },
    });
  } catch (err) {
    console.error('[activity/recent]', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
