const express = require('express');
const router = express.Router();
const letterController = require('../controllers/letters');
const verifyToken = require('../middleware/verify-token');

// GET all letters for logged in user
router.get('/', verifyToken, letterController.getAllLetters);

// GET a specific letter
router.get('/:id', verifyToken, letterController.getLetter);

// POST create a new letter
router.post('/', verifyToken, letterController.createLetter);

// PUT update letter delivery date
router.put('/:id', verifyToken, letterController.updateLetterDeliveryDate);

// DELETE a letter
router.delete('/:id', verifyToken, letterController.deleteLetter);

// POST add reflection to a letter
router.post('/:id/reflection', verifyToken, letterController.addReflection);

// DELETE a reflection from a letter
router.delete('/:id/reflection/:reflectionId', verifyToken, letterController.deleteReflection);

module.exports = router;
