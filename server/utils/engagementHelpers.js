// utils/engagementHelpers.js
// ─────────────────────────────────────────────────────────────────────────────
// Reusable helpers to attach like + comment counts to lean query results.
// Works with the unified Like model (targetType/targetId).
// Use these in posts, thoughts, stories controllers.
// ─────────────────────────────────────────────────────────────────────────────
const Like = require('../models/Like');
const Comment = require('../models/Comment');

/**
 * Attach like counts to an array of lean docs.
 * @param {'post'|'thought'|'story'} targetType
 * @param {Object[]} docs - array of lean Mongoose docs (must have _id)
 * @returns {Object[]} docs with `likes` field populated
 */
async function attachLikeCounts(targetType, docs) {
  if (!docs.length) return docs;
  const ids = docs.map((d) => d._id);
  const agg = await Like.aggregate([
    { $match: { targetType, targetId: { $in: ids } } },
    { $group: { _id: '$targetId', count: { $sum: 1 } } },
  ]);
  const map = Object.fromEntries(agg.map((r) => [r._id.toString(), r.count]));
  return docs.map((d) => ({
    ...d,
    likes: map[d._id.toString()] ?? 0,
  }));
}

/**
 * Attach comment counts to an array of lean docs.
 * @param {'post'|'thought'|'story'} parentType
 * @param {Object[]} docs
 * @returns {Object[]} docs with `commentCount` field populated
 */
async function attachCommentCounts(parentType, docs) {
  if (!docs.length) return docs;
  const ids = docs.map((d) => d._id);
  const agg = await Comment.aggregate([
    { $match: { parentType, parentId: { $in: ids }, isDeleted: false } },
    { $group: { _id: '$parentId', count: { $sum: 1 } } },
  ]);
  const map = Object.fromEntries(agg.map((r) => [r._id.toString(), r.count]));
  return docs.map((d) => ({
    ...d,
    commentCount: map[d._id.toString()] ?? 0,
  }));
}

/**
 * Convenience: attach both likes and comments.
 */
async function attachEngagement(type, docs) {
  const withLikes = await attachLikeCounts(type, docs);
  return attachCommentCounts(type, withLikes);
}

module.exports = { attachLikeCounts, attachCommentCounts, attachEngagement };
