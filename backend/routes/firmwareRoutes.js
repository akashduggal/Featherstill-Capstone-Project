const express = require('express');
const router = express.Router();
const upload = require('../middleware/firmwareUpload');
const adminOnly = require('../middleware/adminAuth');
const {
  uploadFirmware,
  downloadFirmware,
  getLatestFirmware,
  markFirmwareAsLatest,
  listFirmwares,
} = require('./firmwareController');
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
router.post('/upload', adminOnly, upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'image', maxCount: 1 },
]), uploadFirmware);

router.get('/me', adminOnly, (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user.id,
      email: req.user.email,
      isAdmin: req.user.isAdmin,
      uid: req.user.uid,
    },
  });
});
// List admin Only
router.get('/', adminOnly, listFirmwares);
// Mark any firmware latest (admin only)
router.patch('/:id/mark-latest', adminOnly, markFirmwareAsLatest);

/**
 * GET /api/firmware/me
 * Get admin user details (for frontend admin-check)
 * 
 * Response:
 * - 200: Success
 * - 401: Unauthorized
 */
router.get('/me', adminOnly, (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user.id,
      email: req.user.email,
      isAdmin: req.user.isAdmin,
      uid: req.user.uid,
    },
  });
});

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
