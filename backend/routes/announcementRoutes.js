const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getAnnouncements, getAnnouncement, createAnnouncement, updateAnnouncement, deleteAnnouncement } = require('../controllers/announcementController');

router.get('/', authenticate, getAnnouncements);
router.get('/:id', authenticate, getAnnouncement);
router.post('/', authenticate, authorize('super_admin', 'admin', 'manager'), createAnnouncement);
router.put('/:id', authenticate, authorize('super_admin', 'admin', 'manager'), updateAnnouncement);
router.delete('/:id', authenticate, authorize('super_admin', 'admin'), deleteAnnouncement);

module.exports = router;
