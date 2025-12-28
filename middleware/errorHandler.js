/**
 * Error handling middleware
 */

// Custom error class for application errors
class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 404 Not Found handler
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`
  });
};

// Global error handler
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details || null;

  // PostgreSQL specific errors
  if (err.code) {
    switch (err.code) {
      case '23505': // unique_violation
        statusCode = 400;
        message = 'Duplicate entry. A record with this value already exists.';
        if (err.constraint) {
          details = { constraint: err.constraint };
        }
        break;
      case '23503': // foreign_key_violation
        statusCode = 400;
        message = 'Invalid reference. The referenced record does not exist.';
        if (err.constraint) {
          details = { constraint: err.constraint };
        }
        break;
      case '23502': // not_null_violation
        statusCode = 400;
        message = 'Missing required field.';
        if (err.column) {
          details = { column: err.column };
        }
        break;
      case '22P02': // invalid_text_representation
        statusCode = 400;
        message = 'Invalid data type provided.';
        break;
      case '23514': // check_violation
        statusCode = 400;
        message = 'Data validation failed.';
        if (err.constraint) {
          details = { constraint: err.constraint };
        }
        break;
      default:
        console.error('Unhandled database error:', err.code, err.message);
    }
  }

  // Express validator errors
  if (err.array && typeof err.array === 'function') {
    statusCode = 400;
    message = 'Validation error';
    details = err.array();
  }

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error details:', {
      statusCode,
      message,
      stack: err.stack,
      details
    });
  }

  // Send response
  const response = {
    success: false,
    error: message
  };

  if (details) {
    response.details = details;
  }

  if (process.env.NODE_ENV === 'development' && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  AppError,
  notFoundHandler,
  errorHandler,
  asyncHandler
};
