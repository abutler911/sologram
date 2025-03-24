// server/routes/notifications.js
const express = require("express");
const router = express.Router();
const {
  sendCustomNotification,
  getNotificationStats,
} = require("../controllers/notifications");
const { protect, authorize } = require("../middleware/auth");

// Admin-only routes
router.post("/custom", protect, authorize("admin"), sendCustomNotification);
router.get("/stats", protect, authorize("admin"), getNotificationStats);

module.exports = router;
