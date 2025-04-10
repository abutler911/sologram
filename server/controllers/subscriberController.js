// controllers/subscriberController.js
const Subscriber = require("../models/Subscriber");
const Notification = require("../models/Notification");

// Get subscriber statistics
exports.getStats = async (req, res) => {
  try {
    // Get total subscribers count
    const totalSubscribers = await Subscriber.countDocuments({ active: true });

    // Get last notification sent
    const lastNotification = await Notification.findOne()
      .sort({ createdAt: -1 })
      .select("createdAt");

    // Get active subscribers (opened a notification in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const activeSubscribers = await Subscriber.countDocuments({
      active: true,
      lastActive: { $gte: thirtyDaysAgo },
    });

    // Get total notifications sent in last 30 days
    const totalNotifications = await Notification.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Calculate open rate
    const openRate =
      totalNotifications > 0
        ? (
            await Notification.aggregate([
              { $match: { createdAt: { $gte: thirtyDaysAgo } } },
              { $group: { _id: null, totalOpens: { $avg: "$openRate" } } },
            ])
          )[0]?.totalOpens || 0
        : 0;

    // Calculate subscriber growth
    const subscribersLastMonth = await Subscriber.countDocuments({
      createdAt: {
        $gte: new Date(new Date().setDate(new Date().getDate() - 60)),
        $lt: thirtyDaysAgo,
      },
      active: true,
    });

    const recentGrowth =
      subscribersLastMonth > 0
        ? (
            ((totalSubscribers - subscribersLastMonth) / subscribersLastMonth) *
            100
          ).toFixed(1)
        : 0;

    return res.status(200).json({
      success: true,
      data: {
        totalSubscribers,
        activeSubscribers,
        totalNotifications,
        openRate: parseFloat(openRate.toFixed(1)),
        lastSent: lastNotification?.createdAt || null,
        recentGrowth: parseFloat(recentGrowth),
      },
    });
  } catch (err) {
    console.error("Error fetching subscriber stats:", err);
    return res.status(500).json({
      success: false,
      message: "Server error fetching subscriber stats",
    });
  }
};

// Send custom notification
exports.sendCustomNotification = async (req, res) => {
  try {
    const { title, message, url, audience, tags, scheduledFor } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required",
      });
    }

    // Create notification record
    const notification = new Notification({
      title,
      message,
      url: url || null,
      audience: audience || "all",
      tags: tags || [],
      scheduledFor: scheduledFor || null,
      status: scheduledFor ? "scheduled" : "completed",
      sent: scheduledFor
        ? 0
        : await Subscriber.countDocuments({ active: true }),
      openRate: 0,
      createdBy: req.user._id,
    });

    await notification.save();

    // If not scheduled, send immediately
    if (!scheduledFor) {
      // Here you would integrate with your actual notification service
      // e.g., OneSignal, Firebase, etc.
      console.log(
        `Notification "${title}" sent to ${audience || "all"} subscribers`
      );
    }

    return res.status(201).json({
      success: true,
      message: scheduledFor ? "Notification scheduled" : "Notification sent",
      notified: scheduledFor ? 0 : notification.sent,
      notification,
    });
  } catch (err) {
    console.error("Error sending notification:", err);
    return res.status(500).json({
      success: false,
      message: "Server error sending notification",
    });
  }
};

// Get notification history
exports.getNotificationHistory = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;

    // Build query
    const query = {};

    if (status && status !== "all") {
      query.status = status;
    }

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Get notifications
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(100);

    return res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (err) {
    console.error("Error fetching notification history:", err);
    return res.status(500).json({
      success: false,
      message: "Server error fetching notification history",
    });
  }
};

// Get templates
exports.getTemplates = async (req, res) => {
  try {
    // Get templates
    const templates = await Notification.find({ isTemplate: true }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      data: templates,
    });
  } catch (err) {
    console.error("Error fetching notification templates:", err);
    return res.status(500).json({
      success: false,
      message: "Server error fetching notification templates",
    });
  }
};

// Save template
exports.saveTemplate = async (req, res) => {
  try {
    const { name, title, message, url, icon } = req.body;

    if (!name || !title || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, title and message are required",
      });
    }

    // Create template
    const template = new Notification({
      title,
      message,
      url: url || null,
      icon: icon || "default",
      isTemplate: true,
      name,
      createdBy: req.user._id,
    });

    await template.save();

    return res.status(201).json({
      success: true,
      message: "Template saved",
      template,
    });
  } catch (err) {
    console.error("Error saving template:", err);
    return res.status(500).json({
      success: false,
      message: "Server error saving template",
    });
  }
};

// Delete template
exports.deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    await Notification.findOneAndDelete({
      _id: id,
      isTemplate: true,
    });

    return res.status(200).json({
      success: true,
      message: "Template deleted",
    });
  } catch (err) {
    console.error("Error deleting template:", err);
    return res.status(500).json({
      success: false,
      message: "Server error deleting template",
    });
  }
};

// Cancel scheduled notification
exports.cancelScheduledNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      _id: id,
      status: "scheduled",
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Scheduled notification not found",
      });
    }

    notification.status = "cancelled";
    await notification.save();

    return res.status(200).json({
      success: true,
      message: "Scheduled notification cancelled",
    });
  } catch (err) {
    console.error("Error cancelling notification:", err);
    return res.status(500).json({
      success: false,
      message: "Server error cancelling notification",
    });
  }
};
