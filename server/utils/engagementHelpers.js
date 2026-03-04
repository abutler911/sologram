// utils/engagementHelpers.js
const Like = require('../models/Like');
const Comment = require('../models/Comment');

/**
 * Attach like counts + hasLiked to an array of lean docs.
 * @param {'post'|'thought'|'story'} targetType
 * @param {Object[]} docs
 * @param {ObjectId|string|null} userId - current user (from optionalAuth)
 */
async function attachLikeCounts(targetType, docs, userId = null) {
  if (!docs.length) return docs;
  const ids = docs.map((d) => d._id);

  // Count likes per doc
  const countAgg = await Like.aggregate([
    { $match: { targetType, targetId: { $in: ids } } },
    { $group: { _id: '$targetId', count: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(
    countAgg.map((r) => [r._id.toString(), r.count])
  );

  // If we have a logged-in user, check which ones they liked
  let likedSet = new Set();
  if (userId) {
    const userLikes = await Like.find({
      user: userId,
      targetType,
      targetId: { $in: ids },
    })
      .select('targetId')
      .lean();
    likedSet = new Set(userLikes.map((l) => l.targetId.toString()));
  }

  return docs.map((d) => ({
    ...d,
    likes: countMap[d._id.toString()] ?? 0,
    hasLiked: likedSet.has(d._id.toString()),
  }));
}

/**
 * Attach comment counts to an array of lean docs.
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
 * Convenience: attach likes (with hasLiked) + comments.
 */
async function attachEngagement(type, docs, userId = null) {
  const withLikes = await attachLikeCounts(type, docs, userId);
  return attachCommentCounts(type, withLikes);
}

module.exports = { attachLikeCounts, attachCommentCounts, attachEngagement };
