// Updated server/routes/subscribers.js
const express = require("express");
const router = express.Router();
const {
  registerSubscriber,
  updatePreferences,
  unsubscribe,
  getAllSubscribers,
} = require("../controllers/subscribers");
const { protect, authorize } = require("../middleware/auth");

// Public routes
router.post("/register", registerSubscriber);
router.post("/preferences", updatePreferences);
router.post("/unsubscribe", unsubscribe);

// Admin only routes
router.get("/", protect, authorize("admin"), getAllSubscribers);

module.exports = router;
