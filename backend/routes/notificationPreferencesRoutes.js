const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getPreferences, updatePreferences } = require('../controllers/notificationPreferencesController');

router.get('/preferences', authenticate, getPreferences);
router.put('/preferences', authenticate, updatePreferences);

module.exports = router;
