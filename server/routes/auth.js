// routes/auth.js
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
} = require("../controllers/auth");

const { protect, authorize } = require("../middleware/auth");

router.post("/login", login);
router.post("/register", register);

router.get("/me", protect, getMe);
router.put(
  "/update-profile",
  protect,
  upload.single("profileImage"),
  updateProfile
);
router.put("/update-bio", protect, updateBio);
router.put("/promote/:userId", protect, authorize("admin"), promoteToCreator);

module.exports = router;
