const express = require('express');
const router = express.Router();
const upload = require('../middleware/firmwareUpload');
const {
  uploadFirmware,
  downloadFirmware,
  getLatestFirmware,
} = require('./firmwareController');

/**
    * (Uncomment and implement authentication logic as needed)
// const adminOnly = (req, res, next) => {
//   // Check if user is authenticated
//   if (!req.user) {
//     return res.status(401).json({
//       success: false,
//       error: 'Unauthorized - No authentication token provided',
//     });
//   }

//   // Check if user has admin role (adjust based on your User model)
//   if (req.user.role !== 'admin') {
//     return res.status(403).json({
//       success: false,
//       error: 'Forbidden - Admin privileges required',
//     });
//   }

//   next();
// };

/**
 * POST /api/firmware/upload
 * Upload new firmware version (Admin only)
 * 
 * Request:
 * - multipart/form-data
 * - file: binary .bin file
 * - version: semantic version string (1.0.0)
 * - changelog: optional release notes
 * 
 * Response:
 * - 201: Firmware uploaded successfully
 * - 400: Invalid file or version format
 * - 409: Version already exists
 * - 413: File too large (>2MB)
 * - 401: Unauthorized
 * - 403: Forbidden (not admin)
 */
// router.post('/upload', adminOnly, upload.single('file'), uploadFirmware);
router.post('/upload', upload.single('file'), uploadFirmware);

/**
 * GET /api/firmware/:version/download
 * Download firmware binary file
 * 
 * URL Parameters:
 * - version: semantic version string (1.0.0)
 * 
 * Response:
 * - 200: Binary file stream
 * - 404: Version not found
 * - Headers include:
 *   - X-File-Hash: SHA256 hash of file
 *   - X-Firmware-Version: Version number
 */
router.get('/latest', getLatestFirmware);
router.get('/:version/download', downloadFirmware);

module.exports = router;
