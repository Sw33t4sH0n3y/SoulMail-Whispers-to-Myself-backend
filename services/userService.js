/**
 * user service
 */

const User = require('../models/user');

// Fields that are safe to return publicly
const PUBLIC_USER_FIELDS = 'username _id';

// Fields to exclude when returning user data
const PRIVATE_FIELDS = '-password';

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

/**
 * GET USER WITH SETTINGS
 * Get logged in user's full profile include settings and stats
 * Used for profilepageand celebration checks.
 */

const getUserWithSettings = async (userId) => {
  const user = await User.findById(userId).select(PRIVATE_FIELDS);

  if (!user) {
    throw new Error('User not found.');
  }
  return user;
};

/**
 * UPDATE USER PROFILE
 * User wants to update thier name or birthday
 * Birthday is used for birthday celebration animations
 */
const updateProfile = async (userId, profileData) => {
  const updateFields = {};
  if (profileData.name) updateFields.name = profileData.name;
  if (profileData.birthday) updateFields.birthday = profileData.birthday;

  const user = await User.findByIdAndUpdate(
    userId,
    updateFields,
    { new: true }
  ).select(PRIVATE_FIELDS);

  if (!user) {
    throw new Error('User not found.');
  }
  return user;
};

/**
 * UPDATE CELEBRATION SETTINGS
 * User wants to toggle animations on/off
 * They can enable/disable all or invidual celebrations.
 */

const updateSettings = async (userId, settings) => {
  const validSettings = sanitizeSettings(settings);

  const user = await User.findByIdAndUpdate(
    userId,
    { settings: validSettings },
    { new: true }
  ).select(PRIVATE_FIELDS);

if (!user) {
  throw new Error('User not found.');
} 

return user;
};

/**
 * GET USER STATS
 * Retrieve user stats for celebration milestone checks.
 * Stats include: totalLetters, totalReflections, currentStreak, etc
 */

const getUserStats =async (userId) => {
  const user = await User.findById(userId).select('stats');

  if (!user) {
    throw new Error('User not found.');
  }
  return user.stats;
};

/**
 * UPDATE USER STATS
 * Increment user stats when they perform actions
 * Called after creating letters, reflections, etc.
 */

const updateUserStats = async (userId, statUpdates) => {
  const updateObj = {};

  if (statUpdates.incrementLetters) {
    updateObj['stats.totalLetters'] = 1;
  }
  if (statUpdates.incrementReflections) {
    updateObj['stats.totalRefletions'] = 1;
  }
  if (statUpdates.incrementGoalsCompleted) {
    updateObj['stats.totalLetters.goalsCompleted'] = 1;
  }
  if (statUpdates.updateStreak) {
    const user =await User.findById(userId).select('stats');
    const lastActivity = user.stats?.lastActivityDate;
    const today = new Date();

    if (lastActivity) {
      const daysDiff = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));
      if (daysDiff === 1) {
        updateObj['stats.currentStreak'] = (user.stats.currentStreak || 0) + 1;
        if ((user.stats.currentStreak || 0) + 1 > (user.stats.longestStreak || 0)) {
          updateObj['stats.longestStreak'] = (user.stats.currentStreak || 0) + 1;
        }
      } else if (daysDiff > 1) {
        updateObj['stats.currentStreak'] = 1;
      }
    } else {
      updateObj['stats.currentStreak'] = 1;
    }
  }
  const updates = {
    $inc: updateObj,
    $set: { 'stats.lastActivityDate': new Date() }
  };
  if (Object.keys(updateObj).length === 0) {
    delete updates.$inc;
  }

  const user = await User.findByIdAndUpdate(
    userId,
    updates,
    { new: true }
  ).select('stats');

  return user.stats;
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

/**
 * Sanitize celebration settings to ensure only valid fields are saved
 * Prevents injection of unexpected fields
 */

const sanitizeSettings = (settings) => {
  const validKeys = [
    'celebrationsEnabled',
    'birthdayOomph',
    'milestoneOomph',
    'anniversaryOomph',
    'letterDeliveryOomph',
    'goalsAccomplishOomph',
    'streakOomph'
  ];

  const sanitized = {};
  validKeys.forEach((key) => {
    if (typeof settings[key] === 'boolean') {
      sanitized[key] = settings[key];
    }
  });
  return sanitized;
};

// exports
module.exports = {
  // Browsing Users
  getAllUsers,

  // Viewing a Profile
  getUserById,
  getUserWithSettings,
  updateProfile,
  updateSettings,
  getUserStats,
  updateUserStats
};
