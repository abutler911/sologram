const express = require("express");
const router = express.Router();
const {
  getArchivedStories,
  getArchivedStory,
  deleteArchivedStory,
} = require("../controllers/archivedStories");
const { protect } = require("../middleware/auth");

router.use(protect);

router.get("/", getArchivedStories);
router.get("/:id", getArchivedStory);
router.delete("/:id", deleteArchivedStory);

module.exports = router;
