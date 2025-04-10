// routes/subscribers.js
const express = require("express");
const router = express.Router();
const subscriberController = require("../controllers/subscriberController");
const { protect, admin } = require("../middleware/auth");

// Get subscriber statistics
router.get("/stats", protect, admin, subscriberController.getStats);

// Send custom notification
router.post(
  "/custom",
  protect,
  admin,
  subscriberController.sendCustomNotification
);

// Get notification history
router.get(
  "/notifications",
  protect,
  admin,
  subscriberController.getNotificationHistory
);

// Get notification templates
router.get("/templates", protect, admin, subscriberController.getTemplates);

// Save template
router.post("/templates", protect, admin, subscriberController.saveTemplate);

// Delete template
router.delete(
  "/templates/:id",
  protect,
  admin,
  subscriberController.deleteTemplate
);

// Cancel scheduled notification
router.patch(
  "/notifications/:id/cancel",
  protect,
  admin,
  subscriberController.cancelScheduledNotification
);

module.exports = router;
