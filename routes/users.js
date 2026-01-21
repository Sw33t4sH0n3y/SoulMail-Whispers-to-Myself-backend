const express = require('express');
const router = express.Router();
const userController = require('../controllers/users');
const verifyToken = require('../middleware/verify-token');

router.get('/', verifyToken, userController.getAllUsers);
router.get('/:userId', verifyToken, userController.getUserProfile);

module.exports = router;
