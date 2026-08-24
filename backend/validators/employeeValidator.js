const { body } = require('express-validator');

const createEmployeeRules = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('joiningDate').isDate().withMessage('Valid joining date is required'),
  body('departmentId').optional().isInt().withMessage('Valid department is required'),
  body('designationId').optional().isInt().withMessage('Valid designation is required')
];

const updateEmployeeRules = [
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required').normalizeEmail()
];

module.exports = { createEmployeeRules, updateEmployeeRules };
