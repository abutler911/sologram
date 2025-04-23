const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const subscriberController = require("../controllers/subscriberController");

// NEW: Authenticated user registers OneSignal player ID
router.post("/register", protect, async (req, res) => {
  const { playerId } = req.body;

  if (!playerId) {
    return res
      .status(400)
      .json({ success: false, message: "Missing playerId" });
  }

  try {
    const user = req.user;
    user.oneSignalPlayerId = playerId;
    await user.save();

    console.log(
      `[OneSignal] Player ID registered for user ${user.username}: ${playerId}`
    );
    res.status(200).json({ success: true, playerId, user: user._id });
  } catch (err) {
    console.error("[OneSignal] Error registering playerId:", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to register playerId" });
  }
});

// Admin routes (keep these!)
router.get(
  "/stats",
  protect,
  authorize("admin"),
  subscriberController.getStats
);
router.post(
  "/custom",
  protect,
  authorize("admin"),
  subscriberController.sendCustomNotification
);
router.get(
  "/notifications",
  protect,
  authorize("admin"),
  subscriberController.getNotificationHistory
);
router.get(
  "/templates",
  protect,
  authorize("admin"),
  subscriberController.getTemplates
);
router.post(
  "/templates",
  protect,
  authorize("admin"),
  subscriberController.saveTemplate
);
router.delete(
  "/templates/:id",
  protect,
  authorize("admin"),
  subscriberController.deleteTemplate
);
router.patch(
  "/notifications/:id/cancel",
  protect,
  authorize("admin"),
  subscriberController.cancelScheduledNotification
);
router.get(
  "/platform-stats",
  protect,
  authorize("admin"),
  subscriberController.getPlatformStats
);

module.exports = router;
