const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const createUploadDir = (dir) => {
  const fullPath = path.join(__dirname, '..', process.env.UPLOAD_PATH || 'uploads', dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
  return fullPath;
};

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadDir = 'general';
    
    if (req.baseUrl.includes('employees') || req.baseUrl.includes('profile')) {
      uploadDir = 'profiles';
    } else if (req.baseUrl.includes('documents')) {
      uploadDir = 'documents';
    } else if (req.baseUrl.includes('recruitment') || req.baseUrl.includes('candidates')) {
      uploadDir = 'resumes';
    } else if (req.baseUrl.includes('announcements')) {
      uploadDir = 'announcements';
    } else if (req.originalUrl.includes('payslip')) {
      uploadDir = 'payslips';
    }
    
    const dir = createUploadDir(uploadDir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ storage });

module.exports = upload;
