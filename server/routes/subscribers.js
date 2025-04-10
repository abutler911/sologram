// routes/subscribers.js
const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const subscriberController = require("../controllers/subscriberController");

// Public routes
router.post("/register", subscriberController.registerSubscriber);

// Admin routes - protected and require admin role
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

module.exports = router;
