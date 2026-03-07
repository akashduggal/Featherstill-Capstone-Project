const { v4: uuidv4 } = require('uuid');

// Request logging middleware
const requestLogger = (req, res, next) => {
  req.id = uuidv4();
  const startTime = Date.now();

  // Log incoming request
  console.log(`[${new Date().toISOString()}] [REQUEST] [${req.id}]`, {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  // Capture response finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] [RESPONSE] [${req.id}]`, {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
};

module.exports = {
  requestLogger,
};
