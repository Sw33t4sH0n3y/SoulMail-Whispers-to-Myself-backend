/**
 * Receives login/signup requests and delegates to authService.
 * CONTROLLER RESPONSIBILITIES:
 * 1. Extract credentials from HTTP request
 * 2. Call the appropriate service function
 * 3. Convert service results to HTTP responses
 * 4. Convert service errors to appropriate HTTP status codes
 */

const authService = require('../services/authService');

// HTTP status codes mapping

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  CONFLICT: 409,
  SERVER_ERROR: 500
};

// endpoint handlers

/**
 * POST /auth/sign-up
 * Register a new user account
 */
const signUp = async (req, res) => {
  try {
    const { username, password } = req.body;
    const { token } = await authService.signUp(username, password);
    sendSuccess(res, HTTP_STATUS.CREATED, { token });
  } catch (error) {
    sendError(res, error, 'signup');
  }
};

/**
 * POST /auth/sign-in
 * Authenticate an existing user
 */
const signIn = async (req, res) => {
  try {
    const { username, password } = req.body;
    const { token } = await authService.signIn(username, password);
    sendSuccess(res, HTTP_STATUS.OK, { token });
  } catch (error) {
    sendError(res, error, 'signin');
  }
};


// response helpers

/**
 * Send a successful response with consistent format
 */
const sendSuccess = (res, statusCode, data) => {
  res.status(statusCode).json({
    success: true,
    data
  });
};

/**
 * Send an error response with appropriate HTTP status code
 */
const sendError = (res, error, context) => {
  const statusCode = mapErrorToStatusCode(error.message, context);
  res.status(statusCode).json({
    success: false,
    error: error.message
  });
};

/**
 * Map error messages to appropriate HTTP status codes
 */
const mapErrorToStatusCode = (errorMessage, context) => {
  // Username already taken (during signup)
  if (errorMessage.includes('already taken')) {
    return HTTP_STATUS.CONFLICT;
  }

  // Invalid credentials (during signin)
  if (errorMessage.includes('Invalid username or password')) {
    return HTTP_STATUS.UNAUTHORIZED;
  }

  // Default to bad request
  return HTTP_STATUS.BAD_REQUEST;
};


// exports

module.exports = {
  signUp,
  signIn
};
