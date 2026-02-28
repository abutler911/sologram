// routes/memoirs.js
// Public: list + read memoirs.
// Admin: generate + delete.

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getMemoirs,
  getMemoir,
  generate,
  deleteMemoir,
} = require('../controllers/memoirs');

// Public
router.get('/', getMemoirs);
router.get('/:id', getMemoir);

// Admin only
router.post('/generate', protect, authorize('admin'), generate);
router.delete('/:id', protect, authorize('admin'), deleteMemoir);

module.exports = router;
