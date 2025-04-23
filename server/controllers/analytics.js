// server/controllers/analytics.js
const Post = require("../models/Post");
const Like = require("../models/Like");
const Story = require("../models/Story");
const Notification = require("../models/Notification");
const User = require("../models/User"); // Updated from Subscriber

/**
 * Get open rate data for recent notifications, grouped by date
 */
exports.getOpenRateAnalytics = async (req, res) => {
  try {
    const recentNotifications = await Notification.find({ isTemplate: false })
      .sort({ createdAt: -1 })
      .limit(50);

    const dailyStats = {};

    recentNotifications.forEach((notif) => {
      const dateStr = notif.createdAt.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
      });

      if (!dailyStats[dateStr]) {
        dailyStats[dateStr] = { sent: 0, opened: 0 };
      }

      dailyStats[dateStr].sent += notif.sent || 0;
      dailyStats[dateStr].opened += notif.opened || 0;
    });

    const openRateData = Object.entries(dailyStats)
      .reverse()
      .map(([date, { sent, opened }]) => ({
        date,
        rate: sent > 0 ? parseFloat(((opened / sent) * 100).toFixed(1)) : 0,
      }));

    res.status(200).json({ success: true, data: openRateData });
  } catch (err) {
    console.error("Open rate analytics error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * Get platform-wide analytics
 */
exports.getAnalytics = async (req, res) => {
  try {
    const { timeRange } = req.query;
    const dateFilter = {};

    if (timeRange === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter.createdAt = { $gte: weekAgo };
    } else if (timeRange === "month") {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      dateFilter.createdAt = { $gte: monthAgo };
    }

    const totalPosts = await Post.countDocuments(dateFilter);

    const likesAggregation = await Post.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, totalLikes: { $sum: "$likes" } } },
    ]);
    const totalLikes = likesAggregation[0]?.totalLikes || 0;

    const totalStories = await Story.countDocuments({
      ...dateFilter,
      archived: true,
    });

    const totalSubscribers = await User.countDocuments({
      oneSignalPlayerId: { $exists: true },
    });

    const recentPosts = await Post.find(dateFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .select("caption content likes createdAt");

    const popularPosts = await Post.find(dateFilter)
      .sort({ likes: -1 })
      .limit(5)
      .select("caption content likes createdAt");

    const postsByMonth = await Post.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
          likes: { $sum: "$likes" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const formattedPostsByMonth = postsByMonth.map((item) => {
      const date = new Date(item._id.year, item._id.month - 1);
      return {
        label: date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        count: item.count,
        likes: item.likes,
      };
    });

    let growth = null;
    if (timeRange !== "all") {
      const previousDateFilter = {};
      if (timeRange === "week") {
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        previousDateFilter.createdAt = { $gte: twoWeeksAgo, $lt: weekAgo };
      } else if (timeRange === "month") {
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        previousDateFilter.createdAt = { $gte: twoMonthsAgo, $lt: monthAgo };
      }

      const previousPeriodPosts = await Post.countDocuments(previousDateFilter);
      if (previousPeriodPosts > 0) {
        const postGrowth =
          ((totalPosts - previousPeriodPosts) / previousPeriodPosts) * 100;
        growth = { posts: parseFloat(postGrowth.toFixed(1)) };
      }
    }

    res.status(200).json({
      success: true,
      data: {
        totalPosts,
        totalLikes,
        totalStories,
        totalSubscribers,
        recentPosts,
        popularPosts,
        postsByMonth: formattedPostsByMonth,
        growth,
      },
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * Post engagement metrics
 */
exports.getPostEngagement = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findById(id);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    const likeCount = post.likes || 0;
    const uniqueIPs = await Like.countDocuments({ post: id });
    const conversionRate =
      uniqueIPs > 0 ? ((likeCount / uniqueIPs) * 100).toFixed(1) : 0;

    res.status(200).json({
      success: true,
      data: {
        likes: likeCount,
        uniqueVisitors: uniqueIPs,
        conversionRate: parseFloat(conversionRate),
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      },
    });
  } catch (err) {
    console.error("Post engagement analytics error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

/**
 * Subscriber analytics using User model
 */
exports.getSubscriberAnalytics = async (req, res) => {
  try {
    const totalSubscribers = await User.countDocuments({
      oneSignalPlayerId: { $exists: true },
    });

    const deviceBreakdown = await User.aggregate([
      { $match: { oneSignalPlayerId: { $exists: true } } },
      {
        $group: {
          _id: "$deviceType", // Optional field
          count: { $sum: 1 },
        },
      },
    ]);

    const formattedDeviceBreakdown = deviceBreakdown.map((item) => ({
      deviceType: item._id || "unknown",
      count: item.count,
      percentage: parseFloat(
        ((item.count / totalSubscribers) * 100).toFixed(1)
      ),
    }));

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const newSubscribers = await User.countDocuments({
      oneSignalPlayerId: { $exists: true },
      createdAt: { $gte: monthStart },
    });

    const subscribersByMonth = await User.aggregate([
      { $match: { oneSignalPlayerId: { $exists: true } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const formattedGrowth = subscribersByMonth.map((item) => {
      const date = new Date(item._id.year, item._id.month - 1);
      return {
        label: date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        count: item.count,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        totalSubscribers,
        newThisMonth: newSubscribers,
        deviceBreakdown: formattedDeviceBreakdown,
        growthByMonth: formattedGrowth,
      },
    });
  } catch (err) {
    console.error("Subscriber analytics error:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
