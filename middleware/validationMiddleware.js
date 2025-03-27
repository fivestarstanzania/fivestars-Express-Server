// middlewares/validationMiddleware.js
import { body, validationResult } from 'express-validator';
import dotenv from 'dotenv';
dotenv.config();
const ADMIN_SECRET_KEY = process.env.FIVESTARS_SECRET_KEY;

export const validateAndSanitizeRegistration = [
  body('name')
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 3 }).withMessage('Name must be at least 3 characters')
    .trim().escape(),

  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    //.matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/).withMessage('Password must include both letters and numbers'),

  body('phoneNumber')
    .notEmpty().withMessage('Phone number is required')
    //.matches(/^(?:\+255|0)[67][12345678]\d{6}$/, 'Please provide a valid Tanzanian phone number')
    .trim().escape(),
  body('universityName')
    .notEmpty().withMessage('University name is required')
    .isLength({ min: 3 }).withMessage('University name must be at least 3 characters')
    .trim().escape(),
];


export const validateAndSanitizeLogin = [
  
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    //.isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
   // .matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]+$/).withMessage('Password must include both letters and numbers')
   ,

];


export const validateAndSanitizeAdminRegistration = [
  // Validate and sanitize name
  body('name')
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 3 }).withMessage('Name must be at least 3 characters')
    .trim().escape(),

  // Validate password
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),

  // Check if secret key matches the stored one in .env
  body('secretKey')
    .notEmpty().withMessage('Secret key is required')
    .custom(value => {
      if (value !== ADMIN_SECRET_KEY) {
        throw new Error('Invalid secret key');
      }
      return true;
    }),

  // Handle validation results and return errors if any
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];


export const validateAndSanitizeAdminLogin = [
  // Validate and sanitize name
  body('name')
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 3 }).withMessage('Name must be at least 3 characters')
    .trim().escape(),

  // Validate password
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),

  // Handle validation results and return errors if any
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];