const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getReviews, getReview, createReview, updateReview, getPerformanceStats } = require('../controllers/performanceController');

router.get('/stats', authenticate, authorize('super_admin', 'admin', 'manager'), getPerformanceStats);
router.get('/', authenticate, getReviews);
router.get('/:id', authenticate, getReview);
router.post('/', authenticate, authorize('super_admin', 'admin', 'manager'), createReview);
router.put('/:id', authenticate, authorize('super_admin', 'admin', 'manager'), updateReview);

module.exports = router;
