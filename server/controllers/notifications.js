const { sendCustomNotification } = require("../services/notificationService");

// Send custom notification to all subscribers (admin only)
exports.sendCustomNotification = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Notification message is required",
      });
    }

    // Send notification
    const result = await sendCustomNotification(message);

    // If there was an error in the notification service
    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.message,
        error: result.error,
      });
    }

    res.status(200).json({
      success: true,
      message: `Notification sent successfully to ${result.notified} subscribers`,
      notified: result.notified,
      failed: result.failed,
      total: result.total,
    });
  } catch (err) {
    console.error("Send notification error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// Get notification stats (admin only)
exports.getNotificationStats = async (req, res) => {
  try {
    // This could be extended to include more stats from a Notification model
    // if you want to track notification history
    res.status(200).json({
      success: true,
      data: {
        // Sample stats - in a real implementation, you'd pull these from your database
        totalSent: 0,
        lastSent: null,
      },
    });
  } catch (err) {
    console.error("Get notification stats error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
