const express = require('express');
const batteryRoutes = require('./batteryRoutes');
const healthRoutes = require('./healthRoutes');
const firmwareRoutes = require('./firmwareRoutes');

const router = express.Router();

/**
 * Battery API endpoints
 */
router.use('/battery-readings', batteryRoutes);

/**
 * Health check endpoint
 */
router.use('/health', healthRoutes);

/**
 * Firmware OTA endpoints
 */
router.use('/firmware', firmwareRoutes);

/**
 * Root API endpoint
 */
router.get('/', (req, res) => {
  res.json({
    message: 'Featherstill Battery Monitoring API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      batteryReadings: {
        postReading: 'POST /api/battery-readings',
        getReadings: 'GET /api/battery-readings/:email',
        getLatestReading: 'GET /api/battery-readings/:email/latest',
      },
      firmware: {
        me: 'GET /api/firmware/me (admin only)',
        upload: 'POST /api/firmware/upload (admin only)',
        latest: 'GET /api/firmware/latest',
        download: 'GET /api/firmware/:version/download',
      },
    },
  });
});

module.exports = router;
