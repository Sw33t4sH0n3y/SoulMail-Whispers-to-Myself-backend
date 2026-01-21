/**
 * auth service
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Configuration constants
const PASSWORD_SALT_ROUNDS = 12;

// sign up

/**
 * REGISTER A NEW USER
 * new person wants to join our app.
 * We check if their username is available,
 * securely store their password,
 * and give them a token to prove who they are.
 */
const registerNewUser = async (username, password) => {
  // Step 1: Check if the username is already taken
  await ensureUsernameIsAvailable(username);

  // Step 2: Securely hash the password
  const hashedPassword = await hashPassword(password);

  // Step 3: Create the new user in the database
  const newUser = await createUserInDatabase(username, hashedPassword);

  // Step 4: Generate a token for the new user
  const token = generateAuthToken(newUser);

  // Step 5: Return the token and user
  return { token, user: newUser };
};

// sign in

/**
 * AUTHENTICATE AN EXISTING USER
 A returning user wants to log in.
We find them by username,
verify their password matches,
and give them a fresh token.
 */
const authenticateUser = async (username, password) => {
  // Step 1: Find the user by their username
  const user = await findUserByUsername(username);

  // Step 2: Verify the password matches
  await verifyPasswordMatches(password, user.hashedPassword);

  // Step 3: Generate a fresh token for this session
  const token = generateAuthToken(user);

  // Step 4: Return the token and user
  return { token, user };
};


// helper functions

// username validation

/**
 * Check if a username is available (not already taken)
 * Throws an error if the username already exists
 */
const ensureUsernameIsAvailable = async (username) => {
  const existingUser = await User.findOne({ username });

  if (existingUser) {
    throw new Error('Username already taken.');
  }
};

/**
 * Find a user by their username
 * Throws an error if the user doesn't exist
 */
const findUserByUsername = async (username) => {
  const user = await User.findOne({ username });

  if (!user) {
    throw new Error('Invalid username or password');
  }

  return user;
};

// --- Password Helpers ---

/**
 * Hash a password securely using bcrypt
 * The original password is never stored
 */
const hashPassword = async (password) => {
  return await bcrypt.hash(password, PASSWORD_SALT_ROUNDS);
};

/**
 * Verify a plain password matches the hashed version
 * Throws an error if they don't match
 */
const verifyPasswordMatches = async (plainPassword, hashedPassword) => {
  const isMatch = await bcrypt.compare(plainPassword, hashedPassword);

  if (!isMatch) {
    throw new Error('Invalid username or password');
  }
};

// user creation helpers

/**
 * Create a new user in the database
 */
const createUserInDatabase = async (username, hashedPassword) => {
  return await User.create({
    username,
    hashedPassword
  });
};

// token helpers

/**
 * Generate a JWT authentication token for a user
 * The token contains the user's ID and username
 */
const generateAuthToken = (user) => {
  const payload = {
    username: user.username,
    _id: user._id
  };

  return jwt.sign({ payload }, process.env.JWT_SECRET);
};


// exports

module.exports = {
  // Sign Up
  signUp: registerNewUser,

  // Sign In
  signIn: authenticateUser
};
