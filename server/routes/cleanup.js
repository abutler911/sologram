// routes/cleanup.js
// Orphaned media cleanup routes.
// 1. POST /api/cleanup/orphaned-uploads — batch delete by cloudinaryIds (used by client hook + sendBeacon)
// 2. POST /api/cleanup/scan-orphans    — admin-only: scan Cloudinary vs DB and delete unreferenced assets
const express = require('express');
const router = express.Router();
const { cloudinary } = require('../config/cloudinary');
const { protect, authorize } = require('../middleware/auth');
const Post = require('../models/Post');
const Story = require('../models/Story');

const SOLO_PREFIX = process.env.CLOUDINARY_BASE_FOLDER || 'sologram';

// ── Batch delete orphaned uploads ────────────────────────────────────────────
// Called by useUploadCleanup hook on cancel/unmount/tab close.
// Accepts { cloudinaryIds: string[] }
// Auth required (protect) but no admin check — creators can clean their own uploads.
router.post('/orphaned-uploads', protect, async (req, res) => {
  const { cloudinaryIds } = req.body;

  if (!Array.isArray(cloudinaryIds) || cloudinaryIds.length === 0) {
    return res.status(400).json({ success: false, message: 'No IDs provided' });
  }

  // Cap at 20 to prevent abuse
  const ids = cloudinaryIds.slice(0, 20);

  // Safety: only delete assets in the sologram folder
  const safeIds = ids.filter(
    (id) => typeof id === 'string' && id.startsWith(SOLO_PREFIX + '/')
  );

  const results = await Promise.allSettled(
    safeIds.map(async (id) => {
      // Try image first, then video
      let result = await cloudinary.uploader.destroy(id, {
        resource_type: 'image',
        invalidate: true,
      });
      if (result.result !== 'ok') {
        result = await cloudinary.uploader.destroy(id, {
          resource_type: 'video',
          invalidate: true,
        });
      }
      return { id, result: result.result };
    })
  );

  const deleted = results
    .filter((r) => r.status === 'fulfilled' && r.value.result === 'ok')
    .map((r) => r.value.id);

  console.log(
    `[cleanup] Batch deleted ${deleted.length}/${safeIds.length} orphaned uploads`
  );

  res.json({ success: true, deleted: deleted.length, total: safeIds.length });
});

// ── Full orphan scan ─────────────────────────────────────────────────────────
// Admin-only. Scans all Cloudinary assets in sologram/ folder,
// cross-references with posts + stories in DB, deletes unreferenced ones.
// GET params: dryRun=true (default) — set dryRun=false to actually delete.
router.post('/scan-orphans', protect, authorize('admin'), async (req, res) => {
  const dryRun = req.body.dryRun !== false; // default true for safety

  try {
    // 1. Collect all cloudinaryIds referenced in DB
    const [posts, stories] = await Promise.all([
      Post.find({}, { 'media.cloudinaryId': 1 }).lean(),
      Story.find({}, { 'media.cloudinaryId': 1 }).lean(),
    ]);

    const referencedIds = new Set();

    posts.forEach((p) =>
      (p.media || []).forEach((m) => {
        if (m.cloudinaryId) referencedIds.add(m.cloudinaryId);
      })
    );
    stories.forEach((s) =>
      (s.media || []).forEach((m) => {
        if (m.cloudinaryId) referencedIds.add(m.cloudinaryId);
      })
    );

    // 2. Fetch all Cloudinary assets (paginate — max 500 per call)
    const allCloudinaryIds = [];

    for (const resourceType of ['image', 'video']) {
      let nextCursor = null;
      do {
        const opts = {
          type: 'upload',
          resource_type: resourceType,
          prefix: SOLO_PREFIX + '/',
          max_results: 500,
        };
        if (nextCursor) opts.next_cursor = nextCursor;

        const result = await cloudinary.api.resources(opts);
        (result.resources || []).forEach((r) =>
          allCloudinaryIds.push(r.public_id)
        );
        nextCursor = result.next_cursor || null;
      } while (nextCursor);
    }

    // 3. Find orphans — in Cloudinary but not in any DB document
    const orphans = allCloudinaryIds.filter((id) => !referencedIds.has(id));

    if (dryRun) {
      return res.json({
        success: true,
        dryRun: true,
        totalCloudinary: allCloudinaryIds.length,
        totalReferenced: referencedIds.size,
        orphanCount: orphans.length,
        orphans: orphans.slice(0, 50), // preview first 50
      });
    }

    // 4. Delete orphans
    const deleteResults = await Promise.allSettled(
      orphans.map(async (id) => {
        let result = await cloudinary.uploader.destroy(id, {
          resource_type: 'image',
          invalidate: true,
        });
        if (result.result !== 'ok') {
          result = await cloudinary.uploader.destroy(id, {
            resource_type: 'video',
            invalidate: true,
          });
        }
        return { id, result: result.result };
      })
    );

    const deleted = deleteResults
      .filter((r) => r.status === 'fulfilled' && r.value.result === 'ok')
      .map((r) => r.value.id);

    console.log(
      `[cleanup] Orphan scan: deleted ${deleted.length}/${orphans.length}`
    );

    res.json({
      success: true,
      dryRun: false,
      totalCloudinary: allCloudinaryIds.length,
      totalReferenced: referencedIds.size,
      orphanCount: orphans.length,
      deletedCount: deleted.length,
    });
  } catch (err) {
    console.error('[cleanup] scan-orphans error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
