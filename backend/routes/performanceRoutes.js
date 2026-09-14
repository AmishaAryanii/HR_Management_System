const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getReviews, getReview, createReview, updateReview, getPerformanceStats } = require('../controllers/performanceController');

router.get('/stats', authenticate, authorize('admin', 'manager'), getPerformanceStats);
router.get('/', authenticate, getReviews);
router.get('/:id', authenticate, getReview);
router.post('/', authenticate, authorize('admin', 'manager'), createReview);
router.put('/:id', authenticate, authorize('admin', 'manager'), updateReview);

module.exports = router;
