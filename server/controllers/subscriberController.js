// Updated subscriberController.js
const notificationService = require("../services/notificationService");
const Subscriber = require("../models/Subscriber");
const Notification = require("../models/Notification");

// Define controller methods
const subscriberController = {
  // Get subscriber statistics
  getStats: async (req, res) => {
    try {
      // Get stats from OneSignal
      const stats = await notificationService.getStats();

      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (err) {
      console.error("Error fetching subscriber stats:", err);
      return res.status(500).json({
        success: false,
        message: "Server error fetching subscriber stats",
      });
    }
  },

  // Get platform distribution data from OneSignal
  getPlatformStats: async (req, res) => {
    try {
      // Let's attempt to get the platform data from OneSignal
      const platformData = await notificationService.getPlatformDistribution();

      return res.status(200).json({
        success: true,
        data: platformData,
      });
    } catch (err) {
      console.error("Error fetching platform distribution data:", err);
      return res.status(500).json({
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

      // Send notification via OneSignal
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

      // Save to database if you have a model for notifications
      if (typeof Notification !== "undefined") {
        try {
          const notification = new Notification({
            title,
            message,
            url: url || null,
            icon: icon || "default",
            image: image || null,
            audience: audience || "all",
            tags: tags || [],
            scheduledFor: scheduledFor || null,
            status: scheduledFor ? "scheduled" : "completed",
            sentAt: scheduledFor ? null : new Date(),
            sent: result.recipients || 0,
            opened: 0,
            openRate: 0,
            createdBy: req.user._id,
            oneSignalId: result.notificationId,
          });

          await notification.save();
        } catch (dbErr) {
          console.error("Error saving notification to database:", dbErr);
          // Continue even if database save fails
        }
      }

      return res.status(201).json({
        success: true,
        message: scheduledFor ? "Notification scheduled" : "Notification sent",
        notified: result.recipients || 0,
        notificationId: result.notificationId,
      });
    } catch (err) {
      console.error("Error sending notification:", err);
      return res.status(500).json({
        success: false,
        message: err.message || "Server error sending notification",
      });
    }
  },

  // Get notification history
  getNotificationHistory: async (req, res) => {
    try {
      // Try to get history from database first
      let notifications = [];

      if (typeof Notification !== "undefined") {
        try {
          notifications = await Notification.find()
            .sort({ createdAt: -1 })
            .limit(50);

          // Convert to the expected format
          notifications = notifications.map((notification) => ({
            id: notification._id,
            oneSignalId: notification.oneSignalId,
            title: notification.title,
            message: notification.message,
            sentAt: notification.sentAt,
            scheduledFor: notification.scheduledFor,
            audience: notification.audience,
            status: notification.status,
            sent: notification.sent,
            opened: notification.opened,
            openRate: notification.openRate,
          }));
        } catch (dbErr) {
          console.error("Error fetching notifications from database:", dbErr);
        }
      }

      // If no notifications in database, get from OneSignal
      if (notifications.length === 0) {
        notifications = await notificationService.getNotificationHistory();
      }

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
  },

  // Get templates (from database)
  getTemplates: async (req, res) => {
    try {
      let templates = [];

      if (typeof Notification !== "undefined") {
        try {
          templates = await Notification.find({ isTemplate: true }).sort({
            createdAt: -1,
          });

          // Convert to the expected format
          templates = templates.map((template) => ({
            id: template._id,
            name: template.name,
            title: template.title,
            message: template.message,
            url: template.url,
            icon: template.icon,
          }));
        } catch (dbErr) {
          console.error("Error fetching templates from database:", dbErr);
        }
      }

      // If no templates in database, return demo data
      if (templates.length === 0) {
        templates = [
          {
            id: "t1",
            name: "New Content Alert",
            title: "New Content Available!",
            message:
              "We've just published new content that we think you'll love. Check it out now!",
            url: "/explore",
            icon: "content",
          },
          {
            id: "t2",
            name: "Weekly Digest",
            title: "Your Weekly SoloGram Digest",
            message:
              "Here's a recap of the top content from this week. Don't miss out on what's trending!",
            url: "/trending",
            icon: "trending",
          },
        ];
      }

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
  },

  // Save template
  saveTemplate: async (req, res) => {
    try {
      const { name, title, message, url, icon } = req.body;

      if (!name || !title || !message) {
        return res.status(400).json({
          success: false,
          message: "Name, title and message are required",
        });
      }

      let templateId = "t-new";

      // Save to database if available
      if (typeof Notification !== "undefined") {
        try {
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
          templateId = template._id;
        } catch (dbErr) {
          console.error("Error saving template to database:", dbErr);
        }
      }

      return res.status(201).json({
        success: true,
        message: "Template saved",
        template: { id: templateId, name, title, message, url, icon },
      });
    } catch (err) {
      console.error("Error saving template:", err);
      return res.status(500).json({
        success: false,
        message: "Server error saving template",
      });
    }
  },

  // Delete template
  deleteTemplate: async (req, res) => {
    try {
      const { id } = req.params;

      // Delete from database if available
      if (typeof Notification !== "undefined") {
        try {
          await Notification.findByIdAndDelete(id);
        } catch (dbErr) {
          console.error("Error deleting template from database:", dbErr);
        }
      }

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
  },

  // Cancel scheduled notification
  cancelScheduledNotification: async (req, res) => {
    try {
      const { id } = req.params;

      // Find the notification
      let oneSignalId = id;

      if (typeof Notification !== "undefined") {
        try {
          const notification = await Notification.findById(id);
          if (notification && notification.oneSignalId) {
            oneSignalId = notification.oneSignalId;
          }

          // Update status in database
          await Notification.findByIdAndUpdate(id, {
            status: "cancelled",
          });
        } catch (dbErr) {
          console.error("Error updating notification in database:", dbErr);
        }
      }

      // Cancel in OneSignal
      try {
        await notificationService.cancelNotification(oneSignalId);
      } catch (cancelErr) {
        console.error("Error cancelling notification in OneSignal:", cancelErr);
      }

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
  },
};

module.exports = subscriberController;
