const multer = require('multer');
const path = require('path');

// memory storage instead of disk
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === 'file') {
    if (ext !== '.bin') {
      return cb(new Error('Firmware must be .bin file'), false);
    }
  }

  if (file.fieldname === 'image') {
    if (!['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
      return cb(new Error('Invalid image format'), false);
    }
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

module.exports = upload;
