// routes/vaultDocs.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getDocs,
  getDoc,
  createDoc,
  updateDoc,
  deleteDoc,
} = require('../controllers/vaultDocs');

router.use(protect, authorize('admin'));

router.route('/').get(getDocs).post(createDoc);
router.route('/:id').get(getDoc).put(updateDoc).delete(deleteDoc);

module.exports = router;
