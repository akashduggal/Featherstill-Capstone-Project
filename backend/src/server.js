const express = require('express');
const cors = require('cors');
const sequelize = require('../config/database');
const config = require('../config');
const errorHandler = require('../middleware/errorHandler');
const { requestLogger } = require('../middleware/logging');
const apiRoutes = require('../routes');

const app = express();
const PORT = config.app.port;

// ============================================
// Middleware
// ============================================

// CORS
app.use(cors(config.cors));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLogger);

// ============================================
// Routes
// ============================================

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Featherstill Battery Monitoring Backend API',
    version: '1.0.0',
    status: 'Running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api', apiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.path,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// ============================================
// Database Initialization & Server Start
// ============================================

const startServer = async () => {
  try {
    // Sync database models
    console.log('[Server] Syncing database models...');
    await sequelize.sync({ alter: false });
    console.log('[Server] Database models synced successfully');

    // Start Express server
    app.listen(PORT, () => {
      console.log(`[Server] Featherstill API running on port ${PORT}`);
      console.log(`[Server] Environment: ${config.app.env}`);
      console.log(`[Server] Database: ${config.database.name}`);
      console.log(`[Server] Ready to accept requests`);
    });
  } catch (error) {
    console.error('[Server] Failed to start server:', error.message);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
