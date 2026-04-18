const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Firmware } = require('../models');

const STORAGE_DIR = path.join(__dirname, '../storage/firmware');
const SEMANTIC_VERSION_REGEX = /^\d+\.\d+\.\d+$/;

/**
 * Validate semantic versioning format (e.g., 1.0.0)
 */
const validateVersion = (version) => {
  if (!SEMANTIC_VERSION_REGEX.test(version)) {
    throw new Error(
      `Invalid version format. Expected semantic versioning (e.g., 1.0.0), got: ${version}`
    );
  }
  return true;
};

/**
 * Compare two semantic versions.
 * Returns 1 if a > b, -1 if a < b, 0 if equal.
 */
const compareSemver = (a, b) => {
  const parse = (version) => version.split('.').map((n) => Number(n));
  const aParts = parse(a);
  const bParts = parse(b);

  for (let i = 0; i < Math.max(aParts.length, bParts.length); i += 1) {
    const aVal = aParts[i] || 0;
    const bVal = bParts[i] || 0;
    if (aVal > bVal) return 1;
    if (aVal < bVal) return -1;
  }
  return 0;
};

/**
 * Keep only the newest N firmware versions in storage.
 * Older firmware rows remain in the database for audit/history.
 */
const cleanupFirmwareFiles = async (keepCount = 5) => {
  const firmwares = await Firmware.findAll({
    order: [[ 'created_at', 'DESC' ]],
  });

  if (firmwares.length <= keepCount) {
    return;
  }

  const toDelete = firmwares.slice(keepCount);

  for (const fw of toDelete) {
    // Remove file from storage folder
    const filePath = path.join(STORAGE_DIR, fw.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Keep the record for audit; mark as inactive if needed
    // await Firmware.update({ is_active: false }, { where: { id: fw.id } });
  }
};

const generateFileHash = (filePath) => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (chunk) => {
      hash.update(chunk);
    });

    stream.on('end', () => {
      resolve(hash.digest('hex'));
    });

    stream.on('error', (error) => {
      reject(error);
    });
  });
};


exports.uploadFirmware = async (req, res) => {
  try {
    // Validate file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    const { version, changelog } = req.body;

    // Validate version parameter
    if (!version) {
      fs.unlinkSync(req.file.path); // Clean up uploaded file
      return res.status(400).json({
        success: false,
        error: 'Version parameter is required',
      });
    }

    // Validate version format
    try {
      validateVersion(version);
    } catch (error) {
      fs.unlinkSync(req.file.path); // Clean up uploaded file
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    // Check if version already exists
    const existingFirmware = await Firmware.findOne({
      where: { version },
    });

    if (existingFirmware) {
      fs.unlinkSync(req.file.path); // Clean up uploaded file
      return res.status(409).json({
        success: false,
        error: `Firmware version ${version} already exists`,
      });
    }

    // Enforce monotonic version progression (prevent downgrade or same-version replacement)
    const activeFirmwares = await Firmware.findAll({ where: { is_active: true } });
    let latestFirmware = null;

    if (activeFirmwares && activeFirmwares.length > 0) {
      latestFirmware = activeFirmwares.reduce((current, next) => {
        if (compareSemver(next.version, current.version) > 0) {
          return next;
        }
        return current;
      }, activeFirmwares[0]);
    } else {
      const allFirmwares = await Firmware.findAll();
      if (allFirmwares && allFirmwares.length > 0) {
        latestFirmware = allFirmwares.reduce((current, next) => {
          if (compareSemver(next.version, current.version) > 0) {
            return next;
          }
          return current;
        }, allFirmwares[0]);
      }
    }

    if (latestFirmware && compareSemver(version, latestFirmware.version) <= 0) {
      // fs.unlinkSync(req.file.path); // Not sure if to keep back up for how long? 
      return res.status(409).json({
        success: false,
        error: `Firmware version ${version} is not newer than current latest version ${latestFirmware.version}`,
      });
    }

    // Deactivate existing active firmware records before promoting new release
    const firmware = await Firmware.create({
      version,
      filename: finalFilename,
      file_hash: fileHash,
      file_size: fileSize,
      changelog: changelog || null,
      is_active: false,
    });
    // Generate SHA256 hash
    const fileHash = await generateFileHash(req.file.path);
    const fileSize = fs.statSync(req.file.path).size;

    // Rename file to final name
    const finalFilename = `${version}.bin`;
    const finalPath = path.join(STORAGE_DIR, finalFilename);
    fs.renameSync(req.file.path, finalPath);

    // Create database record
    const firmware = await Firmware.create({
      version,
      filename: finalFilename,
      file_hash: fileHash,
      file_size: fileSize,
      changelog: changelog || null,
      is_active: true,
    });

    // Maintain retention policy: keep only the latest 5 versions
    await cleanupFirmwareFiles(5);

    res.status(201).json({
      success: true,
      firmware: {
        id: firmware.id,
        version: firmware.version,
        filename: firmware.filename,
        file_hash: firmware.file_hash,
        file_size: firmware.file_size,
        changelog: firmware.changelog,
        is_active: firmware.is_active,
        created_at: firmware.created_at,
      },
    });
  } catch (error) {
    // Clean up uploaded file in case of error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('Error uploading firmware:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload firmware',
      message: error.message,
    });
  }
};

/**
 * GET /api/firmware/:version/download
 * Download firmware binary file
 */
exports.downloadFirmware = async (req, res) => {
  try {
    const { version } = req.params;

    // Find firmware in database
    const firmware = await Firmware.findOne({
      where: { version },
    });

    if (!firmware) {
      return res.status(404).json({
        success: false,
        error: `Firmware version ${version} not found`,
      });
    }

    // Check if file exists on disk
    const filePath = path.join(STORAGE_DIR, firmware.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(500).json({
        success: false,
        error: 'Firmware file corrupted or missing',
      });
    }

    // Set headers for file download
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${firmware.filename}"`
    );
    res.setHeader('Content-Length', firmware.file_size);
    res.setHeader('X-File-Hash', firmware.file_hash);
    res.setHeader('X-Firmware-Version', firmware.version);

    // Stream file to client
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // Handle stream errors
    fileStream.on('error', (error) => {
      console.error('Error streaming firmware file:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Error downloading firmware',
        });
      }
    });
  } catch (error) {
    console.error('Error downloading firmware:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download firmware',
      message: error.message,
    });
  }
};

/**
 * GET /api/firmware/latest
 * Get metadata for the latest firmware version (by semver, prefers active releases)
 */
exports.getLatestFirmware = async (req, res) => {
  try {
    let firmwares = await Firmware.findAll({ where: { is_active: true } });

    if (!firmwares || firmwares.length === 0) {
      firmwares = await Firmware.findAll();
    }

    if (!firmwares || firmwares.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No firmware versions available',
      });
    }

    const latest = firmwares.reduce((current, next) => {
      if (compareSemver(next.version, current.version) > 0) {
        return next;
      }
      return current;
    }, firmwares[0]);

    return res.status(200).json({
      success: true,
      firmware: {
        id: latest.id,
        version: latest.version,
        filename: latest.filename,
        file_hash: latest.file_hash,
        file_size: latest.file_size,
        changelog: latest.changelog,
        is_active: latest.is_active,
        created_at: latest.created_at,
      },
      download_url: `${req.protocol}://${req.get('host')}/api/firmware/${latest.version}/download`,
    });
  } catch (error) {
    console.error('Error fetching latest firmware:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch latest firmware',
      message: error.message,
    });
  }
};
exports.listFirmwares = async (req, res) => {
  try {
    const firmwares = await Firmware.findAll({
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      data: firmwares,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch firmware list',
      message: error.message,
    });
  }
};


