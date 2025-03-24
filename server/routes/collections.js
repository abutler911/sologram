const express = require("express");
const router = express.Router();
const {
  getCollections,
  getCollection,
  createCollection,
  updateCollection,
  deleteCollection,
  addPostToCollection,
  removePostFromCollection,
} = require("../controllers/collections");
const { protect, authorize } = require("../middleware/auth");
const { upload } = require("../config/cloudinary");

router.get("/", getCollections);
router.get("/:id", getCollection);
router.post(
  "/",
  protect,
  authorize("admin"),
  upload.single("coverImage"),
  createCollection
);
router.put(
  "/:id",
  protect,
  authorize("admin"),
  upload.single("coverImage"),
  updateCollection
);
router.delete("/:id", protect, authorize("admin"), deleteCollection);
router.post("/:id/posts", protect, authorize("admin"), addPostToCollection);
router.delete(
  "/:id/posts/:postId",
  protect,
  authorize("admin"),
  removePostFromCollection
);

module.exports = router;
