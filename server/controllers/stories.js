const mongoose = require('mongoose');
const Story = require('../models/Story');
const cloudinary = require('../config/cloudinary').cloudinary;
const {
  buildStoryEmail,
} = require('../utils/emailTemplates/storyPostedTemplate');
const { sendEmail } = require('../utils/sendEmail');
const User = require('../models/User');
const { notifyFamilySms } = require('../services/notify/notifyFamilySms');

const TITLE_MAX = 100;

const handleServerError = (res, err, customMessage = 'Server Error') => {
  console.error(`[${customMessage}]`, err.message);
  res.status(500).json({
    success: false,
    message: customMessage,
    ...(process.env.NODE_ENV === 'development' && {
      error: err.message,
      stack: err.stack,
    }),
  });
};

// Runs on every getStories call — lightweight bulk update, no per-story saves
async function checkAndArchiveExpiredStories() {
  try {
    const count = await Story.archiveExpired();
    if (count > 0) console.log(`[stories] Archived ${count} expired stories`);
  } catch (err) {
    console.error('[stories] Auto-archive failed:', err.message);
  }
}

// ── GET /api/stories ──────────────────────────────────────────────────────────
exports.getStories = async (req, res) => {
  try {
    await checkAndArchiveExpiredStories();

    const stories = await Story.find({ archived: false })
      .sort({ createdAt: -1 })
      .lean();

    res
      .status(200)
      .json({ success: true, count: stories.length, data: stories });
  } catch (err) {
    handleServerError(res, err, 'Error fetching stories');
  }
};

// ── GET /api/stories/:id ──────────────────────────────────────────────────────
exports.getStory = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid story ID format' });
    }

    const story = await Story.findById(req.params.id);
    if (!story) {
      return res
        .status(404)
        .json({ success: false, message: 'Story not found' });
    }

    res.status(200).json({ success: true, data: story });
  } catch (err) {
    handleServerError(res, err, 'Error fetching story');
  }
};

// ── POST /api/stories ─────────────────────────────────────────────────────────
// Accepts JSON body: { title, caption?, media: [{ mediaUrl, cloudinaryId, mediaType }] }
// Media is already uploaded to Cloudinary by the client — we just save the URLs.
exports.createStory = async (req, res) => {
  try {
    const { title, caption, media } = req.body;

    // ── Validate title ────────────────────────────────────────────────────────
    if (!title || title.trim() === '') {
      return res
        .status(400)
        .json({ success: false, message: 'Title is required' });
    }
    if (title.trim().length > TITLE_MAX) {
      return res.status(400).json({
        success: false,
        message: `Title cannot exceed ${TITLE_MAX} characters`,
      });
    }

    // ── Validate media ────────────────────────────────────────────────────────
    if (!Array.isArray(media) || media.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one media item is required',
      });
    }
    if (media.length > 10) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 10 media files allowed per story',
      });
    }

    // Ensure every item has a URL and valid type
    const validTypes = ['image', 'video'];
    for (const item of media) {
      if (!item.mediaUrl) {
        return res.status(400).json({
          success: false,
          message: 'Each media item must have a mediaUrl',
        });
      }
      if (!validTypes.includes(item.mediaType)) {
        return res.status(400).json({
          success: false,
          message: `Invalid mediaType: ${item.mediaType}`,
        });
      }
    }

    // ── Save story ────────────────────────────────────────────────────────────
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const story = await Story.create({
      title: title.trim(),
      media: media.map((m) => ({
        mediaType: m.mediaType,
        mediaUrl: m.mediaUrl,
        cloudinaryId: m.cloudinaryId || null,
      })),
      expiresAt,
    });

    // ── Notifications (fire-and-forget, non-blocking) ──────────────────────────
    const base = process.env.APP_PUBLIC_URL || 'https://thesologram.com';
    const storyUrl = `${base}/story/${story._id}`;

    // SMS — fire and forget
    notifyFamilySms('story', { title: story.title, url: storyUrl })
      .then((results) => {
        console.table(
          results.map(({ name, phone, success, textId, error }) => ({
            name,
            phone,
            success,
            textId,
            error,
          }))
        );
      })
      .catch((e) => console.error('[SMS notify error]', e?.message || e));

    // Emails — run in parallel, not sequentially
    User.find({})
      .lean()
      .then((users) =>
        Promise.allSettled(
          users.map((user) =>
            sendEmail({
              to: user.email,
              subject: `[SoloGram] 📖 New Story: ${story.title}`,
              html: buildStoryEmail({
                title: story.title,
                description: caption || '',
                storyId: story._id.toString(),
              }),
            })
          )
        )
      )
      .catch((e) => console.error('[Email notify error]', e?.message || e));

    res.status(201).json({ success: true, data: story });
  } catch (err) {
    handleServerError(res, err, 'Error creating story');
  }
};

// ── DELETE /api/stories/:id ───────────────────────────────────────────────────
exports.deleteStory = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid story ID format' });
    }

    const story = await Story.findById(req.params.id);
    if (!story) {
      return res
        .status(404)
        .json({ success: false, message: 'Story not found' });
    }

    // Delete from Cloudinary in parallel
    if (story.media?.length > 0) {
      await Promise.allSettled(
        story.media
          .filter((m) => m.cloudinaryId)
          .map((m) => cloudinary.uploader.destroy(m.cloudinaryId))
      );
    }

    await story.deleteOne();
    res
      .status(200)
      .json({ success: true, message: 'Story deleted successfully', data: {} });
  } catch (err) {
    handleServerError(res, err, 'Error deleting story');
  }
};

// ── PUT /api/stories/:id/archive ──────────────────────────────────────────────
exports.archiveStory = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid story ID format' });
    }

    const story = await Story.findById(req.params.id);
    if (!story)
      return res
        .status(404)
        .json({ success: false, message: 'Story not found' });
    if (story.archived)
      return res
        .status(400)
        .json({ success: false, message: 'Story is already archived' });

    story.archived = true;
    story.archivedAt = new Date();
    await story.save();

    res.status(200).json({
      success: true,
      message: 'Story archived successfully',
      data: story,
    });
  } catch (err) {
    handleServerError(res, err, 'Error archiving story');
  }
};

// ── GET /api/stories/archived ─────────────────────────────────────────────────
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
    handleServerError(res, err, 'Error retrieving archived stories');
  }
};

// ── GET /api/stories/archived/:id ────────────────────────────────────────────
exports.getArchivedStory = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid story ID format' });
    }

    const story = await Story.findById(req.params.id);
    if (!story)
      return res
        .status(404)
        .json({ success: false, message: 'Story not found' });
    if (!story.archived)
      return res
        .status(400)
        .json({ success: false, message: 'This story is not archived' });

    res.status(200).json({ success: true, data: story });
  } catch (err) {
    handleServerError(res, err, 'Error fetching archived story');
  }
};

// ── DELETE /api/stories/archived/:id ─────────────────────────────────────────
exports.deleteArchivedStory = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid story ID format' });
    }

    const story = await Story.findById(req.params.id);
    if (!story)
      return res
        .status(404)
        .json({ success: false, message: 'Story not found' });
    if (!story.archived) {
      return res.status(400).json({
        success: false,
        message: 'Only archived stories can be deleted from the archive',
      });
    }

    if (story.media?.length > 0) {
      await Promise.allSettled(
        story.media
          .filter((m) => m.cloudinaryId)
          .map((m) => cloudinary.uploader.destroy(m.cloudinaryId))
      );
    }

    await story.deleteOne();
    res.status(200).json({
      success: true,
      message: 'Archived story deleted successfully',
      data: {},
    });
  } catch (err) {
    handleServerError(res, err, 'Error deleting archived story');
  }
};
