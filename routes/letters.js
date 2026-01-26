const express = require('express');
const router = express.Router();
const letterController = require('../controllers/letters');
const verifyToken = require('../middleware/verify-token');

// GET available delivery intervals (no auth required - public info)
router.get('/delivery-options', letterController.getDeliveryOptions);

// GET all letters for logged in user
router.get('/', verifyToken, letterController.getAllLetters);

// POST create a new letter
router.post('/', verifyToken, letterController.createLetter);

// POST add reflection to a letter
router.post('/:id/reflection', verifyToken, letterController.addReflection);

// DELETE a reflection from a letter
router.delete('/:id/reflection/:reflectionId', verifyToken, letterController.deleteReflection);

//PUT update goal status
router.put ('/:id/goals/:goalId/status', verifyToken, letterController.updateGoalStatus);

//POST carry forward to another letter
router.post('/:id/goals/:goalId/carry-forward', verifyToken, letterController.carryGoalForward);

//PUT add reflection to a Goal
router.put('/:id/goals/:goalID/reflection', verifyToken, letterController.addGoalReflection);

// GET a specific letter
router.get('/:id', verifyToken, letterController.getLetter);

// PUT update letter delivery date
router.put('/:id', verifyToken, letterController.updateLetterDeliveryDate);

// DELETE a letter
router.delete('/:id', verifyToken, letterController.deleteLetter);

module.exports = router;
