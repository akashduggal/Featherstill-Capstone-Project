const express = require('express');
const batteryRoutes = require('./batteryRoutes');
const healthRoutes = require('./healthRoutes');

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
 * Root API endpoint
 */
router.get('/', (req, res) => {
  res.json({
    message: 'Featherstill Battery Monitoring API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      postReading: 'POST /api/battery-readings',
      getReadings: 'GET /api/battery-readings/:email',
      getLatestReading: 'GET /api/battery-readings/:email/latest',
    },
  });
});

module.exports = router;
