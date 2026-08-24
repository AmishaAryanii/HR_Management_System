const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { getCompany, updateCompany, uploadLogo } = require('../controllers/companyController');
const multer = require('multer');
const path = require('path');

// Configure multer for logo upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = 'company-logo-' + Date.now() + ext;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// Routes - company info is public (needed by login page for name/logo)
router.get('/', getCompany);

// Only admins can update company info
router.put('/', authenticate, authorize('super_admin', 'admin'), updateCompany);
router.post('/logo', authenticate, authorize('super_admin', 'admin'), upload.single('logo'), uploadLogo);

module.exports = router;
