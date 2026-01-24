/**
 * LETTERS CONTROLLER - The HTTP Handler for Letter Operations
 *
 * This controller receives HTTP requests,
 * delegates the actual work to the letterService, and sends back responses.
 *
 * CONTROLLER RESPONSIBILITIES:
 * 1. Extract data from HTTP request (req.body, req.params, req.user)
 * 2. Call the appropriate service function
 * 3. Convert service results to HTTP responses
 * 4. Convert service errors to appropriate HTTP status codes
 */

const letterService = require('../services/letterService');
const { DELIVERY_INTERVALS, INTERVAL_LABELS } = require('../utils/dateCalculator');

// HTTP status code mappings

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500
};

//endpoint handlers

/**
 * GET /letters/delivery-options
 *
 * Returns the available delivery intervals so the frontend
 * can present the user with their choices.
 */
const getDeliveryOptions = (req, res) => {
  const options = Object.entries(DELIVERY_INTERVALS).map(([key, value]) => ({
    id: value,
    label: INTERVAL_LABELS[value],
    requiresCustomDate: value === DELIVERY_INTERVALS.CUSTOM_DATE
  }));

  sendSuccess(res, HTTP_STATUS.OK, {
    question: 'When do you want to get your letter?',
    options
  });
};

/**
 * GET /letters
 * Retrieve all letters belonging to the logged-in user
 */
const getAllLetters = async (req, res) => {
  try {
    const userId = req.user._id;
    const letters = await letterService.getAllLetters(userId);
    sendSuccess(res, HTTP_STATUS.OK, letters);
  } catch (error) {
    sendError(res, error);
  }
};

/**
 * GET /letters/:id
 * Retrieve a specific letter by ID
 */
const getLetter = async (req, res) => {
  try {
    const userId = req.user._id;
    const letterId = req.params.id;
    const letter = await letterService.getLetterById(userId, letterId);
    sendSuccess(res, HTTP_STATUS.OK, letter);
  } catch (error) {
    sendError(res, error);
  }
};

/**
 * POST /letters
 * Create a new letter
 */
const createLetter = async (req, res) => {
  try {
    const userId = req.user._id;
    const letterData = req.body;
    const letter = await letterService.createLetter(userId, letterData);
    sendSuccess(res, HTTP_STATUS.CREATED, letter);
  } catch (error) {
    sendError(res, error);
  }
};

/**
 * PUT /letters/:id
 * Update a letter's delivery date
 */
const updateLetterDeliveryDate = async (req, res) => {
  try {
    const userId = req.user._id;
    const letterId = req.params.id;
    const newDeliveryDate = req.body.deliverAt;
    const letter = await letterService.updateLetterDeliveryDate(userId, letterId, newDeliveryDate);
    sendSuccess(res, HTTP_STATUS.OK, letter);
  } catch (error) {
    sendError(res, error);
  }
};

/**
 * DELETE /letters/:id
 * Delete a letter
 */
const deleteLetter = async (req, res) => {
  try {
    const userId = req.user._id;
    const letterId = req.params.id;
    const result = await letterService.deleteLetter(userId, letterId);
    sendSuccess(res, HTTP_STATUS.OK, result);
  } catch (error) {
    sendError(res, error);
  }
};

/**
 * POST /letters/:id/reflection
 * Add a reflection to a delivered letter
 */
const addReflection = async (req, res) => {
  try {
    const userId = req.user._id;
    const letterId = req.params.id;
    const reflectionData = req.body;
    const letter = await letterService.addReflection(userId, letterId, reflectionData);
    sendSuccess(res, HTTP_STATUS.CREATED, letter);
  } catch (error) {
    sendError(res, error);
  }
};

/**
 * DELETE /letters/:id/reflection/:reflectionId
 * Remove a reflection from a letter
 */
const deleteReflection = async (req, res) => {
  try {
    const userId = req.user._id;
    const letterId = req.params.id;
    const reflectionId = req.params.reflectionId;
    const letter = await letterService.deleteReflection(userId, letterId, reflectionId);
    sendSuccess(res, HTTP_STATUS.OK, letter);
  } catch (error) {
    sendError(res, error);
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
 * Maps service-level errors to HTTP status codes
 */
const sendError = (res, error) => {
  const statusCode = mapErrorToStatusCode(error.message);
  res.status(statusCode).json({
    success: false,
    error: error.message
  });
};

/**
 * Map error messages to appropriate HTTP status codes
 */
const mapErrorToStatusCode = (errorMessage) => {
  if (errorMessage.includes('not found')) {
    return HTTP_STATUS.NOT_FOUND;
  }
  if (errorMessage.includes('Unauthorized')) {
    return HTTP_STATUS.FORBIDDEN;
  }
  if (errorMessage.includes('Cannot edit')) {
    return HTTP_STATUS.FORBIDDEN;
  }
  if (errorMessage.includes('Can only add reflections')) {
    return HTTP_STATUS.BAD_REQUEST;
  }
  return HTTP_STATUS.BAD_REQUEST;
};


// exports

module.exports = {
  getDeliveryOptions,
  getAllLetters,
  getLetter,
  createLetter,
  updateLetterDeliveryDate,
  deleteLetter,
  addReflection,
  deleteReflection
};
