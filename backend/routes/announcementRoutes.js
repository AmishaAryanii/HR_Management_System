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

// Only admin can create, update, delete, publish/unpublish
router.post('/', authenticate, authorize('admin'), createAnnouncement);
router.put('/:id', authenticate, authorize('admin'), updateAnnouncement);
router.delete('/:id', authenticate, authorize('admin'), deleteAnnouncement);
router.put('/:id/publish', authenticate, authorize('admin'), publishAnnouncement);
router.put('/:id/unpublish', authenticate, authorize('admin'), unpublishAnnouncement);

module.exports = router;
