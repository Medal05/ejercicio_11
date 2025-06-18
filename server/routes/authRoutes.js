const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);
router.post('/recover', authController.recoverPassword);
router.post('/verifyRecoveryCode', authController.verifyRecoveryCode);
router.post('/resetPassword', authController.resetPassword);

module.exports = router;
