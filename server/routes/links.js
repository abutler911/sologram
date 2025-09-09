// server/routes/links.js
const router = require("express").Router();

// Simple redirect: /l/:id -> /post/:id
router.get("/l/:id", (req, res) => {
  const id = req.params.id;
  // optionally validate id shape here
  res.redirect(302, `/post/${id}`);
});

module.exports = router;
