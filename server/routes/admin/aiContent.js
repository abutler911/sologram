// routes/admin/aiContent.js
const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../../middleware/auth");
const {
  generateContent,
  getContentHistory,
  saveGeneratedContent,
  deleteContentHistory,
} = require("../../controllers/aiContent");

// All routes require admin role
router.use(protect, authorize("admin"));

// Generate content using OpenAI
router.post("/generate", generateContent);

// Get history of generated content
router.get("/history", getContentHistory);

// Save generated content for future reference
router.post("/save", saveGeneratedContent);

// Delete content from history
router.delete("/history/:id", deleteContentHistory);

module.exports = router;
