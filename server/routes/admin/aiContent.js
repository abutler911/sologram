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

// Test route (no auth required for testing)
router.get("/test", (req, res) => {
  res.json({
    message: "AI Content routes are working!",
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
  });
});

// All other routes require admin role
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
