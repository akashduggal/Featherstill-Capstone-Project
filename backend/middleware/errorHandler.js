const errorHandler = (err, req, res, next) => {
  const timestamp = new Date().toISOString();
  const requestId = req.id || 'unknown';

  // Log error
  console.error(`[${timestamp}] [ERROR] [Request: ${requestId}]`, {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Database validation errors
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: err.errors.map((e) => e.message),
      timestamp,
    });
  }

  // Unique constraint errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      error: 'Duplicate Entry',
      details: err.errors.map((e) => e.message),
      timestamp,
    });
  }

  // Database errors
  if (err.name === 'SequelizeDatabaseError') {
    return res.status(500).json({
      success: false,
      error: 'Database Error',
      message: 'An error occurred while processing your request',
      timestamp,
    });
  }

  // Custom validation errors
  if (err.statusCode === 400) {
    return res.status(400).json({
      success: false,
      error: err.message,
      timestamp,
    });
  }

  // Not found errors
  if (err.statusCode === 404) {
    return res.status(404).json({
      success: false,
      error: err.message,
      timestamp,
    });
  }

  // Default server error
  res.status(err.statusCode || 500).json({
    success: false,
    error: 'Internal Server Error',
    message:
      process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
    timestamp,
  });
};

module.exports = errorHandler;
