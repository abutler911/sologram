const express = require("express");
const router = express.Router();
const {
  subscribe,
  verifyPhone,
  unsubscribe,
  resendVerification,
  getAllSubscribers,
} = require("../controllers/subscribers");
const { protect, authorize } = require("../middleware/auth");

// Public routes for users to manage subscriptions
router.post("/subscribe", subscribe);
router.post("/verify", verifyPhone);
router.post("/unsubscribe", unsubscribe);
router.post("/resend-verification", resendVerification);

// Admin-only routes to manage subscribers
router.get("/", protect, authorize("admin"), getAllSubscribers);

module.exports = router;
