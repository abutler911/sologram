// controllers/memoirs.js
// Public: list and view memoir entries.
// Admin: manually trigger generation for any month.

const Memoir = require('../models/Memoir');
const {
  generateMemoir,
  MONTH_NAMES,
} = require('../services/ai/memoirGenerator');
const { logger } = require('../utils/logger');

// ── GET /api/memoirs — list all, newest first ─────────────────────────────────
exports.getMemoirs = async (req, res) => {
  try {
    const memoirs = await Memoir.find()
      .sort({ year: -1, month: -1 })
      .select('title month year themes stats createdAt')
      .lean();

    res.status(200).json({
      success: true,
      count: memoirs.length,
      data: memoirs,
    });
  } catch (err) {
    console.error('[getMemoirs]', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ── GET /api/memoirs/:id — single memoir ──────────────────────────────────────
exports.getMemoir = async (req, res) => {
  try {
    const memoir = await Memoir.findById(req.params.id);
    if (!memoir) {
      return res
        .status(404)
        .json({ success: false, message: 'Memoir not found' });
    }
    res.status(200).json({ success: true, data: memoir });
  } catch (err) {
    console.error('[getMemoir]', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ── POST /api/memoirs/generate — admin-only, manual trigger ───────────────────
exports.generate = async (req, res) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res
        .status(400)
        .json({ success: false, message: 'month and year are required' });
    }

    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    if (m < 1 || m > 12 || y < 2020 || y > 2100) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid month or year' });
    }

    // Check if one already exists
    const existing = await Memoir.findOne({ month: m, year: y });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Memoir for ${MONTH_NAMES[m]} ${y} already exists`,
        data: existing,
      });
    }

    // Don't allow generating for a month that hasn't ended yet
    const now = new Date();
    const endOfRequestedMonth = new Date(y, m, 1);
    if (endOfRequestedMonth > now) {
      return res.status(400).json({
        success: false,
        message: `${MONTH_NAMES[m]} ${y} hasn't ended yet`,
      });
    }

    logger.info(
      `[memoirs] Manual generation triggered for ${MONTH_NAMES[m]} ${y}`
    );

    const memoir = await generateMemoir(m, y, 'manual');

    res.status(201).json({ success: true, data: memoir });
  } catch (err) {
    // Duplicate key = race condition, two triggers at once
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Memoir for this month already exists',
      });
    }
    console.error('[memoirs.generate]', err);
    res
      .status(500)
      .json({ success: false, message: 'Failed to generate memoir' });
  }
};

// ── DELETE /api/memoirs/:id — admin-only, allows regeneration ─────────────────
exports.deleteMemoir = async (req, res) => {
  try {
    const memoir = await Memoir.findById(req.params.id);
    if (!memoir) {
      return res
        .status(404)
        .json({ success: false, message: 'Memoir not found' });
    }
    await memoir.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    console.error('[deleteMemoir]', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
