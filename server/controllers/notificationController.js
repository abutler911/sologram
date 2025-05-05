// controllers/notificationController.js
const notificationService = require("../services/notificationService");

/**
 * Get notifications for the logged-in user
 */
exports.getUserNotifications = async (req, res) => {
  try {
    const { page, limit, unreadOnly } = req.query;

    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      unreadOnly: unreadOnly === "true",
    };

    const result = await notificationService.getUserNotifications(
      req.user._id,
      options
    );

    res.status(200).json({
      success: true,
      data: result.notifications,
      pagination: result.pagination,
    });
  } catch (err) {
    console.error("Error getting notifications:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

/**
 * Get unread count for the logged-in user (for badges in UI)
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const { notifications, pagination } =
      await notificationService.getUserNotifications(
        req.user._id,
        { unreadOnly: true, limit: 1 } // Just need count, not actual notifications
      );

    res.status(200).json({
      success: true,
      data: {
        unreadCount: pagination.unreadCount,
      },
    });
  } catch (err) {
    console.error("Error getting unread count:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

/**
 * Mark a notification as read
 */
exports.markAsRead = async (req, res) => {
  try {
    const notification = await notificationService.markAsRead(
      req.params.id,
      req.user._id
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found or already read",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

/**
 * Mark all notifications as read
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const count = await notificationService.markAllAsRead(req.user._id);

    res.status(200).json({
      success: true,
      message: `${count} notifications marked as read`,
    });
  } catch (err) {
    console.error("Error marking all notifications as read:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

/**
 * Create a notification (admin only)
 */
exports.createNotification = async (req, res) => {
  try {
    const { title, body, type, reference, referenceModel, recipient, global } =
      req.body;

    let notification;

    if (global === true) {
      notification = await notificationService.createGlobalNotification({
        title,
        body,
        type,
        reference,
        referenceModel,
      });
    } else if (recipient) {
      notification = await notificationService.createNotification({
        title,
        body,
        type,
        reference,
        referenceModel,
        recipient,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Either recipient or global flag must be provided",
      });
    }

    res.status(201).json({
      success: true,
      data: notification,
    });
  } catch (err) {
    console.error("Error creating notification:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

/**
 * Create a bulk notification for multiple users (admin only)
 */
exports.createBulkNotifications = async (req, res) => {
  try {
    const { title, body, type, reference, referenceModel, recipients } =
      req.body;

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Recipients array is required and cannot be empty",
      });
    }

    const notifications = await notificationService.createBulkNotifications({
      title,
      body,
      type,
      reference,
      referenceModel,
      recipients,
    });

    res.status(201).json({
      success: true,
      message: `${notifications.length} notifications created successfully`,
      count: notifications.length,
    });
  } catch (err) {
    console.error("Error creating bulk notifications:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};
