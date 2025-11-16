// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  // Log full error details for debugging
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    code: err.code,
    path: req.path,
    method: req.method
  });

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errorCode = err.code || 'INTERNAL_ERROR';

  // Supabase/PostgreSQL errors
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        statusCode = 409;
        message = 'Resource already exists';
        errorCode = 'DUPLICATE_RESOURCE';
        break;
      case '23503': // Foreign key violation
        statusCode = 400;
        message = 'Invalid reference to related resource';
        errorCode = 'INVALID_REFERENCE';
        break;
      case '23502': // Not null violation
        statusCode = 400;
        message = 'Required field is missing';
        errorCode = 'MISSING_REQUIRED_FIELD';
        break;
      case 'PGRST116': // Supabase: no rows returned
        statusCode = 404;
        message = 'Resource not found';
        errorCode = 'NOT_FOUND';
        break;
      case '42P01': // Undefined table
        statusCode = 500;
        message = 'Database configuration error';
        errorCode = 'DATABASE_ERROR';
        break;
      default:
        statusCode = 500;
        message = 'Database operation failed';
        errorCode = 'DATABASE_ERROR';
    }
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    errorCode = 'VALIDATION_ERROR';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
    errorCode = 'INVALID_TOKEN';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired';
    errorCode = 'TOKEN_EXPIRED';
  }

  // Don't expose internal error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const errorResponse = {
    success: false,
    error: {
      message: isDevelopment ? message : (statusCode >= 500 ? 'Internal server error' : message),
      code: errorCode
    }
  };

  // Include additional details only in development
  if (isDevelopment) {
    errorResponse.error.details = err.message;
    errorResponse.error.stack = err.stack;
    if (err.details) {
      errorResponse.error.additionalInfo = err.details;
    }
  }

  res.status(statusCode).json(errorResponse);
};

// 404 handler
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
};

module.exports = { errorHandler, notFoundHandler };
