const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure storage directory exists
const storageDir = path.join(__dirname, '../storage/firmware');
if (!fs.existsSync(storageDir)) {
  fs.mkdirSync(storageDir, { recursive: true });
}

// Configure multer for firmware uploads
const firmware_storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, storageDir);
  },
  filename: (req, file, cb) => {
    // Store as version.bin temporarily, will be renamed after validation
    const timestamp = Date.now();
    cb(null, `temp_${timestamp}_${file.originalname}`);
  },
});

// File filter to ensure .bin format
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (ext !== '.bin') {
    return cb(new Error('Only .bin files are allowed'), false);
  }
  
  cb(null, true);
};

// Create multer instance
const upload = multer({
  storage: firmware_storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max
  },
});

module.exports = upload;
