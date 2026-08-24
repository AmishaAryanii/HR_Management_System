const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { loginRules, changePasswordRules, forgotPasswordRules, resetPasswordRules } = require('../validators/authValidator');
const {
  login, refreshToken, logout, getMe, changePassword, forgotPassword, resetPassword
} = require('../controllers/authController');

router.post('/login', validate(loginRules), login);
router.post('/refresh', refreshToken);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.post('/change-password', authenticate, validate(changePasswordRules), changePassword);
router.post('/forgot-password', validate(forgotPasswordRules), forgotPassword);
router.post('/reset-password/:token', validate(resetPasswordRules), resetPassword);

module.exports = router;
