/**
 * Letter Service
 *
 * This service handles the complete lifecycle of a letter:
 * 1. A user writes a letter and chooses when to receive it
 * 2. The letter waits until the delivery date arrives
 * 3. Once delivered, the user can reflect on their past words
 */

const Letter = require('../models/letter');
const userService = require('./userService');
const { DELIVERY_INTERVALS } = require('../utils/dateCalculator');
const {
  NotFoundError,
  ForbiddenError,
  ValidationError
} = require('../middleware/errorHandler');


/**
 * GET ALL LETTERS FOR A USER
A user wants to see all their letters, sorted by newest first
 */
const getAllLettersForUser = async (userId) => {
  // Step 1: Find all letters belonging to this user
  const letters = await findLettersByUserId(userId);

  // Step 2: Return the letters (already sorted by the helper)
  return letters;
};

/**
 * GET A SINGLE LETTER BY ID
 * A user wants to read a specific letter.
*  If the delivery date has passed, mark it as delivered."
 */
const getLetterById = async (userId, letterId) => {
  // Step 1: Find the letter
  const letter = await findLetterOrFail(letterId);

  // Step 2: Verify the user owns this letter
  verifyUserOwnsLetter(letter, userId);

  // Step 3: Check if the letter should now be marked as delivered
  await updateDeliveryStatusIfDue(letter);

  // Step 4: Return the letter
  return letter;
};

/**
 * CREATE A NEW LETTER
 * A user writes a letter to their future self, scheduling it for delivery at a specific date.
 */
const createNewLetter = async (userId, letterData) => {
  // Step 1: Prepare the letter data with the user's ID
  const preparedData = prepareLetterData(userId, letterData);

  // Step 2: Save the letter to the database
  const newLetter = await saveLetterToDatabase(preparedData);

  // Step 3: Load the user details onto the letter
  const letterWithUser = await attachUserToLetter(newLetter);

  await updateUserStatsAfterLetterCreated(userId);

  // Step 5: Return the complete letter
  return letterWithUser;
};

/**
 * UPDATE LETTER DELIVERY DATE
 * A user wants to reschedule when their letter will be delivered.
 * But they can only do this if the letter hasn't been delivered yet.
 */
const updateLetterDeliveryDate = async (userId, letterId, newDeliveryDate) => {
  // Step 1: Find the letter
  const letter = await findLetterOrFail(letterId);

  // Step 2: Verify the user owns this letter
  verifyUserOwnsLetter(letter, userId);

  // Step 3: Ensure the letter hasn't been delivered yet
  ensureLetterIsNotDelivered(letter);

  // Step 4: Update the delivery date
  const updatedLetter = await updateDeliveryDate(letterId, newDeliveryDate);

  // Step 5: Return the updated letter
  return updatedLetter;
};

/**
 * DELETE A LETTER
 * A user decides to permanently remove a letter from their collection.
 */
const deleteLetter = async (userId, letterId) => {
  // Step 1: Find the letter
  const letter = await findLetterOrFail(letterId);

  // Step 2: Verify the user owns this letter
  verifyUserOwnsLetter(letter, userId);

  // Step 3: Remove the letter from the database
  await removeLetterFromDatabase(letterId);

  // Step 4: Return confirmation
  return { message: 'Letter deleted successfully' };
};

/**
 * ADD A REFLECTION TO A LETTER
 * After receiving a delivered letter, a user writes their thoughts
 * about how things turned out compared to what they wrote.
 */
const addReflectionToLetter = async (userId, letterId, reflectionData) => {
  // Step 1: Find the letter
  const letter = await findLetterOrFail(letterId);

  // Step 2: Verify the user owns this letter
  verifyUserOwnsLetter(letter, userId);

  // Step 3: Ensure the letter has been delivered (can't reflect on future)
  ensureLetterIsDelivered(letter);

  // Step 4: Add the reflection to the letter
  const updatedLetter = await appendReflection(letter, reflectionData);

  await updateUserStatsAfterReflectionAdded(userId);

  // Step 6: Return the updated letter
  return updatedLetter;
};

/**
 * REMOVE A REFLECTION FROM A LETTER
 * "A user decides to remove one of their reflections from a letter."
 */
const removeReflectionFromLetter = async (userId, letterId, reflectionId) => {
  // Step 1: Find the letter
  const letter = await findLetterOrFail(letterId);

  // Step 2: Verify the user owns this letter
  verifyUserOwnsLetter(letter, userId);

  // Step 3: Remove the specific reflection
  const updatedLetter = await removeReflection(letter, reflectionId);

  // Step 4: Return the updated letter
  return updatedLetter;
};

/**
 * MANAGING GOALS
 * User UPDATE status of a gaol(completed, inprogress, abandoned, carriedForward)
 */

const updateGoalStatus = async (userId, letterId, goalId, statusData) => {
  const letter = await findLetterOrFail(letterId);
  verifyUserOwnsLetter(letter, userId);
  ensureLetterIsDelivered(letter);

  const goal = letter.goals.id(goalId);
  if (!goal) {
    throw new Error('Goal not found');
  }
  goal.status = statusData.status;
  goal.statusUpdateAt = new Date();

  if (statusData.reflection) {
    goal.reflection =statusData.reflection;
  }
  await letter.save();

  if (statusData.status === 'accomplished') {
    await updatUserStatusAfterGoalAccomplished(userId);
  }
  return letter;
};

/**
 * CARRY GOAL FORWARD
 * Move to a new letter
 */
const carryGoalForward = async (userId, oldLetterId, goalId, newLetterId) => {
  const oldLetter = await findLetterOrFail(oldLetterId);
  verifyUserOwnsLetter(oldLetter,userId);
  
  const newLetter = await findLetterOrFail(newLetterId);
  verifyUserOwnsLetter(newLetter, userId);

  const goal = oldLetter.goals.id(goalId);
  if (!goal) {
    throw new Error('Goal not found');
  }

  newLetter.goals.push({
    text: goal.text,
    status: 'pending',
    carriedFowardFrom: oldLetterId
  });
  await newLetter.save();

  goal.status = 'carriedForward';
  goal.carriedForwardTo = newLetterId;
  goal.statusUpdatedAt = new Date();
  await oldLetter.save();

  return { oldLetter, newLetter };
};

/**
 * ADD GOAL REFLECTION
 *  Thoughts why goal wasn't accomplished
 */
const addGoalReflection = async (userId, letterId, goalId, reflection) => {
  const letter = await findLetterOrFail(letterId);
  verifyUserOwnsLetter(letter, userId);
  ensureLetterIsDelivered(letter);

  const goal =letter.goals.id(goalId);
  if (!goal) {
    throw new Error('Goal not found');
  }

  goal.reflection = reflection;
  await letter.save();

  return letter;
};
// --- Database Query Helpers ---

/**
 * Find all letters for a specific user, sorted by newest first
 */
const findLettersByUserId = async (userId) => {
  return await Letter.find({ user: userId })
    .populate('user')
    .sort({ createdAt: -1 });
};

/**
 * Find a letter by ID, or throw an error if not found
 */
const findLetterOrFail = async (letterId) => {
  const letter = await Letter.findById(letterId).populate('user');

  if (!letter) {
    throw new NotFoundError('Letter not found');
  }

  return letter;
};

/**
 * Save a new letter to the database
 */
const saveLetterToDatabase = async (letterData) => {
  return await Letter.create(letterData);
};

/**
 * Remove a letter from the database by ID
 */
const removeLetterFromDatabase = async (letterId) => {
  await Letter.findByIdAndDelete(letterId);
};

/**
 * Update the delivery date of a letter
 */
const updateDeliveryDate = async (letterId, newDate) => {
  return await Letter.findByIdAndUpdate(
    letterId,
    { deliveredAt: newDate },
    { new: true }
  ).populate('user');
};

// --- Data Preparation Helpers ---

/**
 * Prepare letter data by attaching the user ID
 * Frontend calculates deliveredAt, backend just validates and stores it
 */
const prepareLetterData = (userId, letterData) => {
  const { deliveredAt, deliveryInterval, ...restOfLetterData } = letterData;

  return {
    ...restOfLetterData,
    deliveryInterval: deliveryInterval || DELIVERY_INTERVALS.CUSTOM_DATE,
    deliveredAt: new Date(deliveredAt),
    user: userId
  };
};

/**
 * Attach user details to a letter (populate)
 */
const attachUserToLetter = async (letter) => {
  await letter.populate('user');
  return letter;
};

// --- Authorization Helpers ---

/**
 * Verify that the user making the request owns the letter
 * Throws an error if they don't
 */
const verifyUserOwnsLetter = (letter, userId) => {
  const letterOwnerId = letter.user._id || letter.user;

  if (!letterOwnerId.equals(userId)) {
    throw new ForbiddenError('You do not have permission to access this letter');
  }
};

// --- Business Rule Helpers ---

/**
 * Check if a letter's delivery date has passed, and update status if so
 */
const updateDeliveryStatusIfDue = async (letter) => {
  const currentDate = new Date();
  const deliveryDate = new Date(letter.deliveredAt);
  const isDeliveryDatePassed = currentDate > deliveryDate;
  const isNotYetMarkedDelivered = !letter.isDelivered;

  if (isDeliveryDatePassed && isNotYetMarkedDelivered) {
    letter.isDelivered = true;
    await letter.save();
  }
};

/**
 * Ensure a letter has NOT been delivered (for editing restrictions)
 * Throws an error if the letter is already delivered
 */
const ensureLetterIsNotDelivered = (letter) => {
  if (letter.isDelivered) {
    throw new ForbiddenError('Cannot edit a delivered letter');
  }
};

/**
 * Ensure a letter HAS been delivered (for adding reflections)
 * Throws an error if the letter is not yet delivered
 */
const ensureLetterIsDelivered = (letter) => {
  if (!letter.isDelivered) {
    throw new ValidationError('Can only add reflections to delivered letters');
  }
};

// --- Reflection Helpers ---

/**
 * Append a new reflection to a letter's reflections array
 */
const appendReflection = async (letter, reflectionData) => {
  letter.reflections.push(reflectionData);
  await letter.save();
  return letter;
};

/**
 * Remove a specific reflection from a letter
 */
const removeReflection = async (letter, reflectionId) => {
  letter.reflections.pull({ _id: reflectionId });
  await letter.save();
  return letter;
};

/**
 * Update stats after creating letter
 * increments total Lettters and update streak
 */

const updateUserStatsAfterLetterCreated = async (userId) => {
  try {
    await userService.updateUserStats(userId, {
      incrementLetters: true,
      updateStreak: true
    });
  } catch (error) {
    console.error('Failed to update user stats after letter creation:', error.message);
  }
};

/**
 * Update user stats after addin a reflection
 * Increments totalReflections
 */
const updateUserStatsAfterReflectionAdded = async (userId) => {
  try {
    await userService.updateUserStats(userId, {
      incrementsReflections: true
    });
  } catch (error) {
    console.error('Failed to update user stats after reflection:', error.message);
  }
};

const updateUserStatsAfterGoalAccomplished = async (userId) => {
  try {
    await userService.updateUserStats(userId, {
      incrementGoalAccomplished: true
    });
  } catch (error) {
    console.error('Failed to update user stats after goal accomplished:', error.message);
  }
};

// exports

module.exports = {
  // Getting Letters
  getAllLetters: getAllLettersForUser,
  getLetterById,

  // Creating Letters
  createLetter: createNewLetter,

  // Updating Letters
  updateLetterDeliveryDate,

  // Deleting Letters
  deleteLetter,

  // Managing Reflections
  addReflection: addReflectionToLetter,
  deleteReflection: removeReflectionFromLetter,

  updateGoalStatus,
  carryGoalForward,
  addGoalReflection,
};
