import { body, validationResult } from 'express-validator';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
    });
  }
  next();
};

export const validateRegister = [
  body('username')
    .trim()
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters long')
    .escape(),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be either user or admin'),
  handleValidationErrors
];

export const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

export const validateSessionCreate = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Session title is required'),
  body('jobDescription')
    .trim()
    .notEmpty()
    .withMessage('Job description is required'),
  body('companyProfile')
    .optional()
    .trim(),
  body('roleRequirements')
    .optional()
    .trim(),
  handleValidationErrors
];

export const validateInterviewAnswer = [
  body('questionIndex')
    .isInt({ min: 0 })
    .withMessage('Valid question index is required'),
  body('answer')
    .trim()
    .notEmpty()
    .withMessage('Answer cannot be empty'),
  handleValidationErrors
];
