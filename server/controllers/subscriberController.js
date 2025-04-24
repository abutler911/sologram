// server/controllers/subscriberController.js
const User = require("../models/User");
const Notification = require("../models/Notification");
const notificationService = require("../services/notificationService");

const subscriberController = {
  /**
   * Register a device with OneSignal player ID
   * @route POST /api/subscribers/register
   * @access Public
   */
  registerDevice: async (req, res) => {
    try {
      const { playerId } = req.body;

      if (!playerId) {
        return res.status(400).json({
          success: false,
          message: "OneSignal Player ID is required",
        });
      }

      // If user is logged in, associate playerId with their account
      if (req.headers.authorization) {
        try {
          const token = req.headers.authorization.split(" ")[1];
          const jwt = require("jsonwebtoken");
          const decoded = jwt.verify(token, process.env.JWT_SECRET);

          if (decoded && decoded.id) {
            const user = await User.findById(decoded.id);
            if (user) {
              // Update the user's OneSignal player ID
              user.oneSignalPlayerId = playerId;
              await user.save();

              return res.status(200).json({
                success: true,
                message: "Device registered and associated with user account",
              });
            }
          }
        } catch (err) {
          // Token error - continue as anonymous registration
          console.warn(
            "Token verification failed during device registration:",
            err.message
          );
        }
      }

      // Register as anonymous device (no user association)
      return res.status(200).json({
        success: true,
        message: "Device registered successfully",
      });
    } catch (err) {
      console.error("Device registration error:", err);
      return res.status(500).json({
        success: false,
        message: "Server error during device registration",
      });
    }
  },

  /**
   * Get subscriber statistics
   * @route GET /api/subscribers/stats
   * @access Admin
   */
  getStats: async (req, res) => {
    try {
      const stats = await notificationService.getStats();
      res.status(200).json({ success: true, data: stats });
    } catch (err) {
      console.error("Error fetching subscriber stats:", err);
      res.status(500).json({
        success: false,
        message: "Server error fetching subscriber stats",
      });
    }
  },

  /**
   * Get platform distribution data from OneSignal
   * @route GET /api/subscribers/platforms
   * @access Admin
   */
  getPlatformStats: async (req, res) => {
    try {
      const platformData = await notificationService.getPlatformDistribution();
      res.status(200).json({ success: true, data: platformData });
    } catch (err) {
      console.error("Error fetching platform distribution data:", err);
      res.status(500).json({
        success: false,
        message: "Server error fetching platform distribution data",
      });
    }
  },

  /**
   * Send custom notification
   * @route POST /api/subscribers/send
   * @access Admin
   */
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
        userId: req.user._id,
      });

      res.status(201).json({
        success: true,
        message: scheduledFor ? "Notification scheduled" : "Notification sent",
        notified: result.recipients || 0,
        notificationId: result.notificationId,
      });
    } catch (err) {
      console.error("Error sending notification:", err);
      res.status(500).json({
        success: false,
        message: err.message || "Server error sending notification",
      });
    }
  },

  /**
   * Get notification history
   * @route GET /api/subscribers/history
   * @access Admin
   */
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
        sentAt: n.createdAt,
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
      res.status(500).json({
        success: false,
        message: "Server error fetching notification history",
      });
    }
  },

  /**
   * Get saved notification templates
   * @route GET /api/subscribers/templates
   * @access Admin
   */
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
      res.status(500).json({
        success: false,
        message: "Server error fetching notification templates",
      });
    }
  },

  /**
   * Save a notification template
   * @route POST /api/subscribers/templates
   * @access Admin
   */
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
      res.status(500).json({
        success: false,
        message: "Server error saving template",
      });
    }
  },

  /**
   * Delete a template
   * @route DELETE /api/subscribers/templates/:id
   * @access Admin
   */
  deleteTemplate: async (req, res) => {
    try {
      const { id } = req.params;
      await Notification.findByIdAndDelete(id);
      res.status(200).json({ success: true, message: "Template deleted" });
    } catch (err) {
      console.error("Error deleting template:", err);
      res.status(500).json({
        success: false,
        message: "Server error deleting template",
      });
    }
  },

  /**
   * Cancel a scheduled notification
   * @route DELETE /api/subscribers/cancel/:id
   * @access Admin
   */
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

      res.status(200).json({
        success: true,
        message: "Scheduled notification cancelled",
      });
    } catch (err) {
      console.error("Error cancelling notification:", err);
      res.status(500).json({
        success: false,
        message: "Server error cancelling notification",
      });
    }
  },
};

module.exports = subscriberController;
