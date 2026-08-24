const { body } = require('express-validator');

const loginRules = [
  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  body('portal')
    .optional()
    .isIn(['admin', 'manager', 'employee']).withMessage('Portal must be one of: admin, manager, employee')
];

const changePasswordRules = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
];

const forgotPasswordRules = [
  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail()
];

const resetPasswordRules = [
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

module.exports = { loginRules, changePasswordRules, forgotPasswordRules, resetPasswordRules };
