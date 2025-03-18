const express = require("express");
const router = express.Router();
const { upload } = require("../config/cloudinary");
const {
  login,
  getMe,
  updateProfile,
  updateBio,
} = require("../controllers/auth");
const { protect } = require("../middleware/auth");

router.post("/login", login);
router.get("/me", protect, getMe);
router.put(
  "/update-profile",
  protect,
  upload.single("profileImage"),
  updateProfile
);
router.put("/update-bio", protect, updateBio);

module.exports = router;
