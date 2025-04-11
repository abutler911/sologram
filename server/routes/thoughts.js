// routes/thoughts.js
const express = require("express");
const router = express.Router();
const { upload } = require("../config/cloudinary");
const {
  getThoughts,
  getThought,
  createThought,
  updateThought,
  deleteThought,
  likeThought,
  pinThought,
} = require("../controllers/thoughts");
const { protect, authorize } = require("../middleware/auth");

// Public routes
router.get("/", getThoughts);
router.get("/:id", getThought);
router.put("/:id/like", likeThought);

// Admin-only routes
router.post(
  "/",
  protect,
  authorize(["admin"]),
  upload.single("media"),
  createThought
);
router.put(
  "/:id",
  protect,
  authorize(["admin"]),
  upload.single("media"),
  updateThought
);
router.delete("/:id", protect, authorize(["admin"]), deleteThought);
router.put("/:id/pin", protect, authorize(["admin"]), pinThought);

module.exports = router;
