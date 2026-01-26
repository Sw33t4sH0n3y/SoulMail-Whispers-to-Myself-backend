/**
 * Centralized Error Handling for Express
/**
 * Base application error class
 * Use this for all operational errors
 */
class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    // Capture stack trace, excluding constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error - for invalid input data
 * Supports field-specific error messages
 */
class ValidationError extends AppError {
  constructor(message, fields = null) {
    super(message, 400);
    this.code = 'VALIDATION_ERROR';
    this.fields = fields; // { fieldName: "error message" }
  }
}

/**
 * Not found error - for missing resources
 */
class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.code = 'NOT_FOUND';
  }
}

/**
 * Authorization error - for permission issues
 */
class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403);
    this.code = 'FORBIDDEN';
  }
}

/**
 * Authentication error - for auth failures
 */
class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401);
    this.code = 'UNAUTHORIZED';
  }
}
/**
 * Extract user-friendly messages from Mongoose ValidationError
 *
 * Mongoose ValidationError structure:
 * {
 *   message: "Letter validation failed: field1: msg1, field2: msg2",
 *   errors: {
 *     "field1": { message: "msg1", path: "field1" },
 *     "field2": { message: "msg2", path: "field2" }
 *   }
 * }
 */
const extractMongooseErrors = (err) => {
  const fields = {};

  if (err.errors) {
    Object.keys(err.errors).forEach(key => {
      // Get the field name (last part of path like "reflections.0.reflection" -> "reflection")
      const fieldPath = err.errors[key].path;
      const fieldName = fieldPath.includes('.')
        ? fieldPath.split('.').pop()
        : fieldPath;

      fields[fieldName] = err.errors[key].message;
    });
  }

  return fields;
};

/**
 * Get a single user-friendly message from field errors
 * Returns the first error message found
 */
const getFirstErrorMessage = (fields) => {
  const messages = Object.values(fields);
  return messages.length > 0 ? messages[0] : 'Validation failed';
};

/**
 * Global error handling middleware
 * Must be registered AFTER all routes in Express
 *
 * Response format:
 * {
 *   success: false,
 *   error: {
 *     code: "ERROR_CODE",
 *     message: "User-friendly message",
 *     fields: { fieldName: "Field-specific error" }  // Only for validation errors
 *   }
 * }
 */
const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error:', err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error('Stack:', err.stack);
  }

  // Handle Mongoose ValidationError
  if (err.name === 'ValidationError' && err.errors) {
    const fields = extractMongooseErrors(err);
    const message = getFirstErrorMessage(fields);

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message,
        fields
      }
    });
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'Invalid ID format'
      }
    });
  }

  // Handle Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      error: {
        code: 'DUPLICATE_ERROR',
        message: `A record with this ${field} already exists`,
        fields: { [field]: `This ${field} is already in use` }
      }
    });
  }

  // Handle our custom AppError classes
  if (err.isOperational) {
    const response = {
      success: false,
      error: {
        code: err.code || 'ERROR',
        message: err.message
      }
    };

    // Include field errors if present (ValidationError)
    if (err.fields) {
      response.error.fields = err.fields;
    }

    return res.status(err.statusCode).json(response);
  }

  // Handle unknown errors (programming errors, etc.)
  // Don't leak error details in production
  const isDev = process.env.NODE_ENV === 'development';

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isDev ? err.message : 'An unexpected error occurred',
      ...(isDev && { stack: err.stack })
    }
  });
};

/**
 * Wraps async route handlers to catch errors and pass to error middleware
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// exports

module.exports = {
  // Error classes
  AppError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,

  // Middleware
  errorHandler,
  asyncHandler,

  // Utilities
  extractMongooseErrors
};
