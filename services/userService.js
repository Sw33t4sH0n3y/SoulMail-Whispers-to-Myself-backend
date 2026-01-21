/**
 * user service
 */

const User = require('../models/user');

// Fields that are safe to return publicly
const PUBLIC_USER_FIELDS = 'username _id';

/**
 * GET ALL USERS
 * Someone wants to see a list of all users in the system.
 * We return only their public information (username and ID).
 */
const getAllUsers = async () => {
  // Step 1: Query the database for all users (public fields only)
  const users = await findAllUsersPublicInfo();

  // Step 2: Return the list of users
  return users;
};

// VIEWING A PROFILE

/**
 * GET A USER BY THEIR ID
 * Someone wants to view a specific user's profile.
 * We find that user and return their information."
 */
const getUserById = async (userId) => {
  // Step 1: Find the user in the database
  const user = await findUserOrFail(userId);

  // Step 2: Return the user's profile
  return user;
};


// helper functions

// --- Database Query Helpers ---

/**
 * Find all users in the database, returning only public fields
 * This protects sensitive data like hashed passwords
 */
const findAllUsersPublicInfo = async () => {
  return await User.find({}, PUBLIC_USER_FIELDS);
};

/**
 * Find a user by their ID
 * Throws an error if the user doesn't exist
 */
const findUserOrFail = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found.');
  }

  return user;
};


// exports
module.exports = {
  // Browsing Users
  getAllUsers,

  // Viewing a Profile
  getUserById
};
