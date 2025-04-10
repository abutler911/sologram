// routes/subscribers.js
const express = require("express");
const router = express.Router();
const { protect, admin } = require("../middleware/auth");

// Create temporary controller functions (you can replace these with proper implementations later)
const subscriberController = {
  // Get subscriber statistics
  getStats: async (req, res) => {
    try {
      // Simulation data - replace with actual database queries in production
      const stats = {
        totalSubscribers: 768,
        activeSubscribers: 687,
        totalNotifications: 42,
        openRate: 38.5,
        lastSent: new Date(),
        recentGrowth: 5.2,
      };

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

  // Send custom notification
  sendCustomNotification: async (req, res) => {
    try {
      const { title, message, url, audience, tags, scheduledFor } = req.body;

      if (!title || !message) {
        return res.status(400).json({
          success: false,
          message: "Title and message are required",
        });
      }

      // Simulate sending notification
      console.log(
        `Notification "${title}" would be sent to ${
          audience || "all"
        } subscribers`
      );

      return res.status(201).json({
        success: true,
        message: scheduledFor ? "Notification scheduled" : "Notification sent",
        notified: 768, // Number of subscribers notified
      });
    } catch (err) {
      console.error("Error sending notification:", err);
      return res.status(500).json({
        success: false,
        message: "Server error sending notification",
      });
    }
  },

  // Get notification history
  getNotificationHistory: async (req, res) => {
    try {
      // Demo data
      const notifications = [
        {
          id: "n1",
          title: "New Feature Released",
          message:
            "We've just launched our new Stories feature! Try it out today.",
          sentAt: new Date(Date.now() - 86400000 * 1).toISOString(),
          audience: "all",
          sent: 763,
          opened: 342,
          openRate: 44.8,
          status: "completed",
        },
        {
          id: "n2",
          title: "Weekend Special Content",
          message: "Check out our curated weekend content picks just for you!",
          sentAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          audience: "active_users",
          sent: 680,
          opened: 412,
          openRate: 60.6,
          status: "completed",
        },
      ];

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

  // Get templates
  getTemplates: async (req, res) => {
    try {
      // Demo data
      const templates = [
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

      console.log(`Template "${name}" saved`);

      return res.status(201).json({
        success: true,
        message: "Template saved",
        template: { id: "t-new", name, title, message, url, icon },
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

      console.log(`Template ${id} deleted`);

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

      console.log(`Notification ${id} cancelled`);

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

// Routes
router.get("/stats", protect, admin, subscriberController.getStats);
router.post(
  "/custom",
  protect,
  admin,
  subscriberController.sendCustomNotification
);
router.get(
  "/notifications",
  protect,
  admin,
  subscriberController.getNotificationHistory
);
router.get("/templates", protect, admin, subscriberController.getTemplates);
router.post("/templates", protect, admin, subscriberController.saveTemplate);
router.delete(
  "/templates/:id",
  protect,
  admin,
  subscriberController.deleteTemplate
);
router.patch(
  "/notifications/:id/cancel",
  protect,
  admin,
  subscriberController.cancelScheduledNotification
);

module.exports = router;
