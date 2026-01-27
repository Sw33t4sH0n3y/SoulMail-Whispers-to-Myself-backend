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
 * 4. Errors are automatically handled by the global error middleware
 */

const letterService = require('../services/letterService');
const { DELIVERY_INTERVALS, INTERVAL_LABELS } = require('../utils/dateCalculator');
const { asyncHandler } = require('../middleware/errorHandler');

// HTTP status code mappings
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201
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
const getAllLetters = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const letters = await letterService.getAllLetters(userId);
  sendSuccess(res, HTTP_STATUS.OK, letters);
});

/**
 * GET /letters/:id
 * Retrieve a specific letter by ID
 */
const getLetter = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const letterId = req.params.id;
  const letter = await letterService.getLetterById(userId, letterId);
  sendSuccess(res, HTTP_STATUS.OK, letter);
});

/**
 * POST /letters
 * Create a new letter
 */
const createLetter = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const letterData = req.body;
  const letter = await letterService.createLetter(userId, letterData);
  sendSuccess(res, HTTP_STATUS.CREATED, letter);
});

/**
 * PUT /letters/:id
 * Update a letter's delivery date
 */
const updateLetterDeliveryDate = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const letterId = req.params.id;
  const newDeliveryDate = req.body.deliveredAt;
  const letter = await letterService.updateLetterDeliveryDate(userId, letterId, newDeliveryDate);
  sendSuccess(res, HTTP_STATUS.OK, letter);
});

/**
 * DELETE /letters/:id
 * Delete a letter
 */
const deleteLetter = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const letterId = req.params.id;
  const result = await letterService.deleteLetter(userId, letterId);
  sendSuccess(res, HTTP_STATUS.OK, result);
});

/**
 * POST /letters/:id/reflection
 * Add a reflection to a delivered letter
 */
const addReflection = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const letterId = req.params.id;
  const reflectionData = req.body;
  const letter = await letterService.addReflection(userId, letterId, reflectionData);
  sendSuccess(res, HTTP_STATUS.CREATED, letter);
});

/**
 * DELETE /letters/:id/reflection/:reflectionId
 * Remove a reflection from a letter
 */
const deleteReflection = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const letterId = req.params.id;
  const reflectionId = req.params.reflectionId;
  const letter = await letterService.deleteReflection(userId, letterId, reflectionId);
  sendSuccess(res, HTTP_STATUS.OK, letter);
});

/**
 * PUT /letters/:id/goals/:goalId/status
 * Update goal status
 */
const updateGoalStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const letterId = req.params.id;
    const goalId = req.params.goalId;
    const statusData = req.body;

    const letter = await letterService.updateGoalStatus(userId, letterId, goalId, statusData);
    sendSuccess(res, HTTP_STATUS.OK, letter);
  } catch (error) {
    sendError(res, error);
  }
};
/**
 * POST /letters/:id/goals/:goalId/carry-forward
 * Carry goal to new letter
 */
const carryGoalForward = async (req, res) => {
  try {
    const userId = req.user._id;
    const oldLetterId = req.params.id;
    const goalId = req.params.goalId;
    const { newLetterId } = req.body;

    const result = await letterService.carryGoalForward(userId, oldLetterId, goalId, newLetterId);
    sendSuccess(res, HTTP_STATUS.OK, result);
  } catch (error) {
    sendError(res, error);
  }
};

/**
 * PUT /letters/:id/goals/:goalId/reflection
 * Add reflection to a goal
 */
const addGoalReflection = async (req, res) => {
  try{
    const userId = req.user._id;
    const letterId = req.params.id;
    const goalId = req.params.goalId;
    const { reflection } = req.body;

    const letter = await letterService.addGoalReflection(userId, letterId, goalId, reflection);
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


// exports

module.exports = {
  getDeliveryOptions,
  getAllLetters,
  getLetter,
  createLetter,
  updateLetterDeliveryDate,
  deleteLetter,
  addReflection,
  deleteReflection,
  updateGoalStatus,
  carryGoalForward,
  addGoalReflection
};
