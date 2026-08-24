const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { getDocuments, getDocument, uploadDocument, verifyDocument, downloadDocument, deleteDocument } = require('../controllers/documentController');

router.get('/', authenticate, getDocuments);
router.get('/:id', authenticate, getDocument);
router.post('/upload', authenticate, upload.single('file'), uploadDocument);
router.put('/:id/verify', authenticate, authorize('super_admin', 'admin'), verifyDocument);
router.get('/:id/download', authenticate, downloadDocument);
router.delete('/:id', authenticate, authorize('super_admin', 'admin'), deleteDocument);

module.exports = router;
