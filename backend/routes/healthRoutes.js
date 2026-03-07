const express = require('express');
const router = express.Router();

/**
 * GET /health
 * Health check endpoint for load balancers and monitoring
 */
router.get('/', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
  });
});

module.exports = router;
