// routes/auth.js - Update with new routes
const express = require("express");
const router = express.Router();
const { upload } = require("../config/cloudinary");
const {
  login,
  register,
  getMe,
  updateProfile,
  updateBio,
  promoteToCreator,
  refreshToken, // New
  logout, // New
} = require("../controllers/auth");

const { protect, authorize } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiter"); // You'll need to create this

// Public routes
router.post("/login", authLimiter, login);
router.post("/register", upload.single("profileImage"), register);
router.post("/refresh-token", refreshToken); // New route

// Protected routes
router.get("/me", protect, getMe);
router.post("/logout", protect, logout); // New route
router.put(
  "/update-profile",
  protect,
  upload.single("profileImage"),
  updateProfile
);
router.put("/update-bio", protect, updateBio);
router.put("/promote/:userId", protect, authorize("admin"), promoteToCreator);

module.exports = router;
