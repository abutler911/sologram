// controllers/vaultDocs.js
const VaultDoc = require('../models/VaultDoc');
const { logger } = require('../utils/logger');

// GET /api/vault/docs — list all, newest first
exports.getDocs = async (req, res) => {
  try {
    const { category, status, q } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (status) filter.status = status;
    if (q) filter.$text = { $search: q };

    const docs = await VaultDoc.find(filter)
      .sort({ createdAt: -1 })
      .select('title excerpt category status tags wordCount createdAt updatedAt')
      .lean();

    res.json({ success: true, count: docs.length, data: docs });
  } catch (err) {
    logger.error('[vaultDocs.getDocs]', { context: { error: err.message } });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/vault/docs/:id — single doc
exports.getDoc = async (req, res) => {
  try {
    const doc = await VaultDoc.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: doc });
  } catch (err) {
    logger.error('[vaultDocs.getDoc]', { context: { error: err.message } });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/vault/docs — create
exports.createDoc = async (req, res) => {
  try {
    const { title, content, category, tags, status, excerpt } = req.body;
    const doc = await VaultDoc.create({ title, content, category, tags, status, excerpt });
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    logger.error('[vaultDocs.createDoc]', { context: { error: err.message } });
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/vault/docs/:id — update
exports.updateDoc = async (req, res) => {
  try {
    const { title, content, category, tags, status, excerpt } = req.body;
    const doc = await VaultDoc.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });

    if (title !== undefined) doc.title = title;
    if (content !== undefined) doc.content = content;
    if (category !== undefined) doc.category = category;
    if (tags !== undefined) doc.tags = tags;
    if (status !== undefined) doc.status = status;
    if (excerpt !== undefined) doc.excerpt = excerpt;

    await doc.save();
    res.json({ success: true, data: doc });
  } catch (err) {
    logger.error('[vaultDocs.updateDoc]', { context: { error: err.message } });
    if (err.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/vault/docs/:id
exports.deleteDoc = async (req, res) => {
  try {
    const doc = await VaultDoc.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Document deleted' });
  } catch (err) {
    logger.error('[vaultDocs.deleteDoc]', { context: { error: err.message } });
    res.status(500).json({ success: false, message: 'Server error' });
  }
};