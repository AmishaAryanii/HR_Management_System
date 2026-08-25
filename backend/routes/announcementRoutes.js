const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  getAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  publishAnnouncement,
  unpublishAnnouncement
} = require('../controllers/announcementController');

// All authenticated users can view announcements
router.get('/', authenticate, getAnnouncements);
router.get('/:id', authenticate, getAnnouncement);

// Only admin and super_admin can create, update, delete, publish/unpublish
router.post('/', authenticate, authorize('super_admin', 'admin'), createAnnouncement);
router.put('/:id', authenticate, authorize('super_admin', 'admin'), updateAnnouncement);
router.delete('/:id', authenticate, authorize('super_admin', 'admin'), deleteAnnouncement);
router.put('/:id/publish', authenticate, authorize('super_admin', 'admin'), publishAnnouncement);
router.put('/:id/unpublish', authenticate, authorize('super_admin', 'admin'), unpublishAnnouncement);

module.exports = router;
