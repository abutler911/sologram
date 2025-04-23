// subscriberController.js
const notificationService = require("../services/notificationService");
const Notification = require("../models/Notification");

const subscriberController = {
  // Get subscriber statistics
  getStats: async (req, res) => {
    try {
      const stats = await notificationService.getStats();
      res.status(200).json({ success: true, data: stats });
    } catch (err) {
      console.error("Error fetching subscriber stats:", err);
      res
        .status(500)
        .json({
          success: false,
          message: "Server error fetching subscriber stats",
        });
    }
  },

  // Get platform distribution data from OneSignal
  getPlatformStats: async (req, res) => {
    try {
      const platformData = await notificationService.getPlatformDistribution();
      res.status(200).json({ success: true, data: platformData });
    } catch (err) {
      console.error("Error fetching platform distribution data:", err);
      res
        .status(500)
        .json({
          success: false,
          message: "Server error fetching platform distribution data",
        });
    }
  },

  // Send custom notification
  sendCustomNotification: async (req, res) => {
    try {
      const { title, message, url, icon, image, audience, tags, scheduledFor } =
        req.body;

      if (!title || !message) {
        return res.status(400).json({
          success: false,
          message: "Title and message are required",
        });
      }

      const result = await notificationService.sendNotification({
        title,
        message,
        url,
        icon,
        image,
        scheduledFor,
        audience,
        tags,
      });

      res.status(201).json({
        success: true,
        message: scheduledFor ? "Notification scheduled" : "Notification sent",
        notified: result.recipients || 0,
        notificationId: result.notificationId,
      });
    } catch (err) {
      console.error("Error sending notification:", err);
      res
        .status(500)
        .json({
          success: false,
          message: err.message || "Server error sending notification",
        });
    }
  },

  // Get notification history
  getNotificationHistory: async (req, res) => {
    try {
      let notifications = await Notification.find()
        .sort({ createdAt: -1 })
        .limit(50);

      if (notifications.length === 0) {
        notifications = await notificationService.getNotificationHistory();
      }

      const formatted = notifications.map((n) => ({
        id: n._id,
        oneSignalId: n.oneSignalId,
        title: n.title,
        message: n.message,
        sentAt: n.sentAt,
        scheduledFor: n.scheduledFor,
        audience: n.audience,
        status: n.status,
        sent: n.sent,
        opened: n.opened,
        openRate: n.openRate,
      }));

      res.status(200).json({ success: true, data: formatted });
    } catch (err) {
      console.error("Error fetching notification history:", err);
      res
        .status(500)
        .json({
          success: false,
          message: "Server error fetching notification history",
        });
    }
  },

  // Get saved notification templates
  getTemplates: async (req, res) => {
    try {
      const templates = await Notification.find({ isTemplate: true }).sort({
        createdAt: -1,
      });

      const formatted = templates.map((t) => ({
        id: t._id,
        name: t.name,
        title: t.title,
        message: t.message,
        url: t.url,
        icon: t.icon,
      }));

      res.status(200).json({ success: true, data: formatted });
    } catch (err) {
      console.error("Error fetching templates:", err);
      res
        .status(500)
        .json({
          success: false,
          message: "Server error fetching notification templates",
        });
    }
  },

  // Save a notification template
  saveTemplate: async (req, res) => {
    try {
      const { name, title, message, url, icon } = req.body;

      if (!name || !title || !message) {
        return res.status(400).json({
          success: false,
          message: "Name, title and message are required",
        });
      }

      const template = new Notification({
        name,
        title,
        message,
        url: url || null,
        icon: icon || "default",
        isTemplate: true,
        createdBy: req.user._id,
      });

      await template.save();

      res.status(201).json({
        success: true,
        message: "Template saved",
        template: {
          id: template._id,
          name,
          title,
          message,
          url,
          icon,
        },
      });
    } catch (err) {
      console.error("Error saving template:", err);
      res
        .status(500)
        .json({ success: false, message: "Server error saving template" });
    }
  },

  // Delete a template
  deleteTemplate: async (req, res) => {
    try {
      const { id } = req.params;
      await Notification.findByIdAndDelete(id);
      res.status(200).json({ success: true, message: "Template deleted" });
    } catch (err) {
      console.error("Error deleting template:", err);
      res
        .status(500)
        .json({ success: false, message: "Server error deleting template" });
    }
  },

  // Cancel a scheduled notification
  cancelScheduledNotification: async (req, res) => {
    try {
      const { id } = req.params;
      let oneSignalId = id;

      const notification = await Notification.findById(id);
      if (notification?.oneSignalId) {
        oneSignalId = notification.oneSignalId;
        await Notification.findByIdAndUpdate(id, { status: "cancelled" });
      }

      await notificationService.cancelNotification(oneSignalId);

      res
        .status(200)
        .json({ success: true, message: "Scheduled notification cancelled" });
    } catch (err) {
      console.error("Error cancelling notification:", err);
      res
        .status(500)
        .json({
          success: false,
          message: "Server error cancelling notification",
        });
    }
  },
};

module.exports = subscriberController;
