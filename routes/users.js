const express = require('express');
const router = express.Router();
const userController = require('../controllers/users');
const verifyToken = require('../middleware/verify-token');

router.get('/profile', verifyToken, userController.getMyProfile);
router.put('/profile', verifyToken, userController.updateMyProfile);
router.put('/settings', verifyToken, userController.updateSettings);
router.get('/stats', verifyToken, userController.getMyStats);

router.get('/', verifyToken, userController.getAllUsers);
router.get('/:userId', verifyToken, userController.getUserProfile);

module.exports = router;
