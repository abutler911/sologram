// server/routes/subscribers.js
const express = require("express");
const router = express.Router();
const subscriberController = require("../controllers/subscriberController");
const { protect, authorize } = require("../middleware/auth");

// Public route to register device token
router.post("/register", subscriberController.registerDevice);

// Protected routes (require authentication)
router.get(
  "/stats",
  protect,
  authorize("admin"),
  subscriberController.getStats
);
router.get(
  "/platforms",
  protect,
  authorize("admin"),
  subscriberController.getPlatformStats
);
router.get(
  "/history",
  protect,
  authorize("admin"),
  subscriberController.getNotificationHistory
);
router.post(
  "/send",
  protect,
  authorize("admin"),
  subscriberController.sendCustomNotification
);
router.delete(
  "/cancel/:id",
  protect,
  authorize("admin"),
  subscriberController.cancelScheduledNotification
);

// Template management
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

module.exports = router;
