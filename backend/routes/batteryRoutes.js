const express = require('express');
const router = express.Router();
const {
  postBatteryReading,
  getBatteryReadings,
  getLatestReading,
} = require('./batteryController');

/**
 * POST /api/battery-readings
 * Save a new battery reading
 */
router.post('/', postBatteryReading);

/**
 * GET /api/battery-readings/:email
 * Get all readings for a user
 */
router.get('/:email', getBatteryReadings);

/**
 * GET /api/battery-readings/:email/latest
 * Get latest reading for a user
 */
router.get('/:email/latest', getLatestReading);

module.exports = router;
