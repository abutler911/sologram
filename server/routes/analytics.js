// server/routes/analytics.js
const express = require("express");
const router = express.Router();
const {
  getAnalytics,
  getPostEngagement,
  getSubscriberAnalytics,
} = require("../controllers/analytics");
const { protect, authorize } = require("../middleware/auth");

// All analytics routes should be protected and admin-only
router.use(protect);
router.use(authorize("admin"));

// Get basic analytics for the platform
router.get("/", getAnalytics);

// Get engagement metrics for a specific post
router.get("/posts/:id/engagement", getPostEngagement);

// Get subscriber analytics
router.get("/subscribers", getSubscriberAnalytics);

// routes/analytics.js
router.get("/subscribers/open-rates", getOpenRateAnalytics);

module.exports = router;
