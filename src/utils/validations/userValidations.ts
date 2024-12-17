// validations/userValidation.js
import { body } from 'express-validator';
import { ROLES } from '../../constants';

export const registerUserValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 3 })
    .withMessage('Name must be at least 3 characters long'),
  body('email')
    .trim()
    .notEmpty()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .notEmpty()
    .withMessage('Password must be at least 6 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
  body('roles').trim().notEmpty().withMessage('Please specify user type'),
];

export const loginUserValidation = [
  body('email')
    .trim()
    .notEmpty()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .notEmpty()
    .withMessage('Password must be at least 6 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
  body('roles')
    .trim()
    .notEmpty()
    .withMessage('Please specify user type')
    .isIn([ROLES.ADMIN, ROLES.LANDOWNER, ROLES.RESEARCHER, ROLES.UNIVERSITY])
    .withMessage(
      'Invalid role. Must be Admin, landowner, researcher, or university'
    ),
];

export const addLandownerValidation = [
  // Validate email
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
];
