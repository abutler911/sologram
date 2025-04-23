// controllers/notificationController.js
const User = require("../models/User");
const notificationService = require("../services/notificationService");
const winston = require("winston");
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.File({
      filename: "notification-ctrl-error.log",
      level: "error",
    }),
    new winston.transports.File({ filename: "notification-ctrl.log" }),
  ],
});

// Update OneSignal player ID
exports.updateOneSignalId = async (req, res) => {
  try {
    const { playerId } = req.body;

    if (!playerId || typeof playerId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Valid player ID is required",
      });
    }

    // Check if this player ID is already assigned to another user
    const existingUser = await User.findOne({
      oneSignalPlayerId: playerId,
      _id: { $ne: req.user.id }, // Not the current user
    });

    if (existingUser) {
      logger.info(
        `Player ID ${playerId} was reassigned from user ${existingUser._id} to user ${req.user.id}`
      );
      // Remove the player ID from the previous user
      await User.findByIdAndUpdate(existingUser._id, {
        $set: { oneSignalPlayerId: null },
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { oneSignalPlayerId: playerId } },
      { new: true }
    ).select("oneSignalPlayerId");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    logger.info(
      `User ${req.user.id} updated OneSignal player ID to ${playerId}`
    );
    res.status(200).json({
      success: true,
      message: "Notification settings updated successfully",
      data: {
        oneSignalPlayerId: user.oneSignalPlayerId,
      },
    });
  } catch (error) {
    logger.error(
      `Error updating OneSignal ID for user ${req.user?.id}: ${error.message}`
    );
    res.status(500).json({
      success: false,
      message: "Failed to update notification settings",
    });
  }
};

// Get notification status
exports.getNotificationStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("oneSignalPlayerId");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        isSubscribed: !!user.oneSignalPlayerId,
      },
    });
  } catch (error) {
    logger.error(
      `Error getting notification status for user ${req.user?.id}: ${error.message}`
    );
    res.status(500).json({
      success: false,
      message: "Failed to fetch notification status",
    });
  }
};

// Send test notification (only for admin/creator roles)
exports.sendTestNotification = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.role !== "admin" && user.role !== "creator") {
      return res.status(403).json({
        success: false,
        message: "Only admins and creators can send test notifications",
      });
    }

    if (!user.oneSignalPlayerId) {
      return res.status(400).json({
        success: false,
        message: "You need to register for notifications first",
      });
    }

    const result = await notificationService.sendNotificationToUsers(
      "This is a test notification from Sologram",
      "Test Notification",
      process.env.FRONTEND_URL || "https://thesologram.com",
      [user.oneSignalPlayerId]
    );

    res.status(200).json({
      success: true,
      message: "Test notification sent successfully",
      data: result,
    });
  } catch (error) {
    logger.error(
      `Error sending test notification for user ${req.user?.id}: ${error.message}`
    );
    res.status(500).json({
      success: false,
      message: "Failed to send test notification",
    });
  }
};
