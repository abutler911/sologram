// server/controllers/analytics.js
const Post = require("../models/Post");
const Like = require("../models/Like");
const Story = require("../models/Story");
const Subscriber = require("../models/Subscriber");

/**
 * Get basic analytics for the entire platform
 * @route   GET /api/analytics
 * @access  Private (Admin only)
 */
exports.getAnalytics = async (req, res) => {
  try {
    // Optional query parameters
    const { timeRange } = req.query; // Values: 'all', 'month', 'week'

    // Create date filters based on timeRange
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

    // Get total posts count
    const totalPosts = await Post.countDocuments(dateFilter);

    // Get total likes count
    const likesAggregation = await Post.aggregate([
      { $match: dateFilter },
      { $group: { _id: null, totalLikes: { $sum: "$likes" } } },
    ]);
    const totalLikes =
      likesAggregation.length > 0 ? likesAggregation[0].totalLikes : 0;

    // Get total stories count
    const totalStories = await Story.countDocuments({
      ...dateFilter,
      archived: true, // Count only archived stories to prevent double counting
    });

    // Get total subscribers count
    const totalSubscribers = await Subscriber.countDocuments({
      isActive: true,
    });

    // Get most recent posts
    const recentPosts = await Post.find(dateFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .select("caption content likes createdAt");

    // Get most popular posts
    const popularPosts = await Post.find(dateFilter)
      .sort({ likes: -1 })
      .limit(5)
      .select("caption content likes createdAt");

    // Get post counts aggregated by month
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

    // Transform month data to a more frontend-friendly format
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

    // Optional: Calculate growth percentages
    let growth = null;

    if (timeRange !== "all") {
      // If we're looking at a specific time range, compare with the previous period
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

      // Get post count from previous period
      const previousPeriodPosts = await Post.countDocuments(previousDateFilter);

      // Calculate growth percentage
      if (previousPeriodPosts > 0) {
        const postGrowth =
          ((totalPosts - previousPeriodPosts) / previousPeriodPosts) * 100;
        growth = {
          posts: parseFloat(postGrowth.toFixed(1)),
        };
      }
    }

    // Return all the analytics data
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
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

/**
 * Get post engagement metrics
 * @route   GET /api/analytics/posts/:id/engagement
 * @access  Private (Admin only)
 */
exports.getPostEngagement = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Get like count from post
    const likeCount = post.likes || 0;

    // Get unique IP count from likes collection
    const uniqueIPs = await Like.countDocuments({ post: id });

    // Calculate approximate conversion rate
    // This assumes every IP that viewed the post is stored. In a real app,
    // you'd have a dedicated view tracking system
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
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

/**
 * Get subscriber analytics
 * @route   GET /api/analytics/subscribers
 * @access  Private (Admin only)
 */
exports.getSubscriberAnalytics = async (req, res) => {
  try {
    // Get total subscriber count
    const totalSubscribers = await Subscriber.countDocuments({
      isActive: true,
    });

    // Get subscribers by device type
    const deviceBreakdown = await Subscriber.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$deviceType",
          count: { $sum: 1 },
        },
      },
    ]);

    // Format device breakdown
    const formattedDeviceBreakdown = deviceBreakdown.map((item) => ({
      deviceType: item._id || "unknown",
      count: item.count,
      percentage: parseFloat(
        ((item.count / totalSubscribers) * 100).toFixed(1)
      ),
    }));

    // Get new subscribers this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const newSubscribers = await Subscriber.countDocuments({
      isActive: true,
      createdAt: { $gte: monthStart },
    });

    // Get subscriber growth over time
    const subscribersByMonth = await Subscriber.aggregate([
      { $match: { isActive: true } },
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

    // Format subscriber growth
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
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
