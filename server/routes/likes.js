// routes/likes.js
// ─────────────────────────────────────────────────────────────────────────────
// Unified like routes — replaces per-model like endpoints.
//
// POST  /api/likes/toggle  { targetType, targetId }  → auth required
// GET   /api/likes/count   ?targetType=x&targetId=y  → public
// POST  /api/likes/check   { targets: [...] }        → auth required
// ─────────────────────────────────────────────────────────────────────────────
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { toggle, count, batchCheck } = require('../controllers/likes');

router.post('/toggle', protect, toggle);
router.get('/count', count);
router.post('/check', protect, batchCheck);

module.exports = router;
