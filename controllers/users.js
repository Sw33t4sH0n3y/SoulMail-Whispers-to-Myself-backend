/**
 * USERS CONTROLLER - The HTTP Handler for User Profile Operations
 * This controller handles requests to view user information.
 * 1. Extract user ID from request params
 * 2. Perform authorization checks (users can only view their own profile)
 * 3. Call the appropriate service function
 * 4. Convert service results to HTTP responses
 */

const userService = require('../services/userService');

// http status mappings

const HTTP_STATUS = {
  OK: 200,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500
};
//endpoint handlers
/**
 * GET /users
 * Retrieve list of all users (public information only)
 */
const getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    sendSuccess(res, HTTP_STATUS.OK, users);
  } catch (error) {
    sendError(res, error);
  }
};

/**
 * GET /users/:userId
 * Retrieve a specific user's profile
 * Note: Users can only access their own profile
 */
const getUserProfile = async (req, res) => {
  try {
    const requestingUserId = req.user._id;
    const requestedUserId = req.params.userId;

    // Authorization check: Users can only view their own profile
    if (requestingUserId !== requestedUserId) {
      return sendForbidden(res, 'Unauthorized');
    }

    const user = await userService.getUserById(requestedUserId);
    sendSuccess(res, HTTP_STATUS.OK, { user });
  } catch (error) {
    sendError(res, error);
  }
};
/** 
* GET /users/profile
* Retrieve logged in user's pofile with settings and stats
*/

    const getMyProfile = async (req, res) => {
      try {
        const userId = req.user._id;
        const user = await userService.getUserWithSettings(userId);
        sendSuccess(res, HTTP_STATUS.OK, user);
      } catch (error) {
        sendError(res, error);
      }
    };

/**
 * PUT/users/profile
 * update the logged inusers profile (name, birthday)
 */
    const updateMyProfile = async (req, res) => {
      try {
        const userId = req.user._id;
        const { name, birthday } = req.body
        
        if(!name && !birthday) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            error: 'Please include name or birthday to update'
          });
        }
        const updatedUser = await userService.updateProfile(userId, { name, birthday });
        sendSuccess(res, HTTP_STATUS.OK, updatedUser);
      } catch (error) {
        sendError(res, error);
      }
    };

    /**
     * PUT /users/settings
     * Update the looged in users celebration settings
     */
      const updateSettings = async (req, res) => {
        try {
        const userId = req.user._id;
        const { settings } = req.body
        
        if(!settings) {
          return res.status(HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            error: 'Please include settings to update'
          });        
        }
        const updatedUser = await userService.updateSettings(userId, settings);
        sendSuccess(res, HTTP_STATUS.OK, updatedUser);
      } catch (error) {
        sendError(res, error);
      }
    };

  /**
   * GET /users/stats
   * Retrieve logged in users stats for celebration checks
   */

  const getMyStats = async (req, res) => {
    try {
      const userId = req.user._id;
      const stats = await userService.getUserStats(userId);
      sendSuccess(res, HTTP_STATUS.OK, stats);
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
 * Send a forbidden (403) response
 */
const sendForbidden = (res, message) => {
  res.status(HTTP_STATUS.FORBIDDEN).json({
    success: false,
    error: message
  });
};

/**
 * Send an error response with appropriate HTTP status code
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
  return HTTP_STATUS.SERVER_ERROR;
};


// exports
module.exports = {
  getAllUsers,
  getUserProfile,
  getMyProfile,
  updateMyProfile,
  updateSettings,
  getMyStats
};
