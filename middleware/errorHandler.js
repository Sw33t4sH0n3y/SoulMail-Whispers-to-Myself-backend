/**
 * Centralized Error Handling for Express
 *
 * This file provides:
 * 1. Custom error classes for different types of errors (validation, not found, etc.)
 * 2. A global error handler middleware that formats all errors consistently
 * 3. Utility functions for handling async routes and extracting error details
 */

// Custom Error Classes

/**
 * Base application error class - parent class for all custom errors
 *
 * The "isOperational" flag distinguishes between:
 * - Operational errors (expected, like "user not found") - safe to show to users
 * - Programming errors (bugs, like undefined variable) - should be hidden in production
 */
class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Marks this as a known, handleable error

    // Removes this constructor call from the stack trace for cleaner debugging
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error (HTTP 400) - for invalid user input
 *
 * Use when: Form data is invalid, required fields are missing, data format is wrong
 * Example: User submits a reflection with fewer than 50 characters
 */
class ValidationError extends AppError {
  constructor(message, fieldErrors = null) {
    super(message, 400);
    this.code = 'VALIDATION_ERROR';
    this.fields = fieldErrors; // Object mapping field names to their specific error messages
  }
}

/**
 * Not Found Error (HTTP 404) - for missing resources
 *
 * Use when: The requested item doesn't exist in the database
 * Example: User tries to view a letter that was deleted
 */
class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.code = 'NOT_FOUND';
  }
}

/**
 * Forbidden Error (HTTP 403) - for permission issues
 *
 * Use when: User is logged in but doesn't have permission for this action
 * Example: User tries to view someone else's letter
 */
class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403);
    this.code = 'FORBIDDEN';
  }
}

/**
 * Unauthorized Error (HTTP 401) - for authentication failures
 *
 * Use when: User is not logged in or their token is invalid/expired
 * Example: Request made without a valid JWT token
 */
class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401);
    this.code = 'UNAUTHORIZED';
  }
}

/**
 * AI Service Error (HTTP 503) - for external AI API failures
 *
 * Use when: Google Gemini API is unavailable or returns an error
 * Stores the original error for debugging while showing a friendly message to users
 */
class AIServiceError extends AppError {
  constructor(message = 'AI service encountered an error', originalError = null) {
    super(message, 503); // 503 = Service Unavailable
    this.code = 'AI_SERVICE_ERROR';
    this.originalError = originalError;

    // Preserve details from the AI provider for debugging
    if (originalError) {
      this.providerStatus = originalError.status;
      this.providerMessage = originalError.message;
    }
  }
}

// Helper Functions

/**
 * Extracts user-friendly error messages from Mongoose validation errors
 *
 * Mongoose returns errors like: { "reflections.0.reflection": { message: "..." } }
 * This converts it to: { reflection: "..." }
 */
const extractMongooseErrors = (mongooseError) => {
  const fieldErrors = {};

  if (mongooseError.errors) {
    Object.keys(mongooseError.errors).forEach(errorKey => {
      // Handle nested paths like "reflections.0.reflection" -> extract just "reflection"
      const fullPath = mongooseError.errors[errorKey].path;
      const fieldName = fullPath.includes('.')
        ? fullPath.split('.').pop()
        : fullPath;

      fieldErrors[fieldName] = mongooseError.errors[errorKey].message;
    });
  }

  return fieldErrors;
};

/**
 * Gets the first error message from a field errors object
 * Used to provide a single summary message when multiple fields have errors
 */
const getFirstErrorMessage = (fieldErrors) => {
  const errorMessages = Object.values(fieldErrors);
  return errorMessages.length > 0 ? errorMessages[0] : 'Validation failed';
};

// Error Handler Middleware

/**
 * Global error handling middleware for Express
 *
 * IMPORTANT: Must be registered AFTER all routes in server.js
 * Express recognizes this as an error handler because it has 4 parameters
 *
 * All errors flow through here and get formatted as:
 * { success: false, error: { code, message, fields } }
 */
const errorHandler = (error, request, response, next) => {
  console.error('Error:', error.message);

  const isDevelopment = process.env.NODE_ENV === 'development';
  if (isDevelopment) {
    console.error('Stack:', error.stack);
  }

  // Handle Mongoose Validation Errors (required fields, min/max length, etc.)
  if (error.name === 'ValidationError' && error.errors) {
    const fieldErrors = extractMongooseErrors(error);
    const summaryMessage = getFirstErrorMessage(fieldErrors);

    return response.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: summaryMessage,
        fields: fieldErrors
      }
    });
  }

  // Handle Mongoose Cast Errors (invalid MongoDB ObjectId format)
  if (error.name === 'CastError') {
    return response.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'Invalid ID format'
      }
    });
  }

  // Handle MongoDB Duplicate Key Errors (code 11000 = unique constraint violation)
  if (error.code === 11000) {
    const duplicateField = Object.keys(error.keyValue)[0];
    return response.status(400).json({
      success: false,
      error: {
        code: 'DUPLICATE_ERROR',
        message: `A record with this ${duplicateField} already exists`,
        fields: { [duplicateField]: `This ${duplicateField} is already in use` }
      }
    });
  }

  // Handle Custom Application Errors (our own error classes)
  if (error.isOperational) {
    const errorResponse = {
      success: false,
      error: {
        code: error.code || 'ERROR',
        message: error.message
      }
    };

    if (error.fields) {
      errorResponse.error.fields = error.fields;
    }

    return response.status(error.statusCode).json(errorResponse);
  }

  // Handle Unknown Errors (bugs) - hide details in production
  return response.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isDevelopment ? error.message : 'An unexpected error occurred',
      ...(isDevelopment && { stack: error.stack })
    }
  });
};

// Async Handler Utility

/**
 * Wraps async route handlers to automatically catch errors
 *
 * Without this, every async route would need its own try/catch block.
 * This wrapper catches any rejected promise and passes the error to Express.
 *
 * Promise.resolve() wraps the function result so it works with both:
 * - Async functions (which return promises)
 * - Regular functions (which return values)
 * If the promise rejects (throws an error), .catch(next) sends it to errorHandler.
 */
const asyncHandler = (routeHandler) => {
  return (request, response, next) => {
    Promise.resolve(routeHandler(request, response, next)).catch(next);
  };
};

// Exports

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
  UnauthorizedError,
  AIServiceError,
  errorHandler,
  asyncHandler,
  extractMongooseErrors
};
