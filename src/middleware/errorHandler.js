// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Supabase errors
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        statusCode = 409;
        message = 'Resource already exists';
        break;
      case '23503': // Foreign key violation
        statusCode = 400;
        message = 'Invalid reference';
        break;
      case '23502': // Not null violation
        statusCode = 400;
        message = 'Required field missing';
        break;
      default:
        message = 'Database error';
    }
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// 404 handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
};

module.exports = { errorHandler, notFoundHandler };
