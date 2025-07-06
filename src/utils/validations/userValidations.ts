// validations/userValidation.js
import { body, query } from 'express-validator';
import { ROLES } from '../../constants.js';
import { enumToArray, normalizeEmailForGmail } from '../utils.js';

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
    .custom((value) => {
      // Normalize the email according to Gmail rules
      const normalizedEmail = normalizeEmailForGmail(value);
      return normalizedEmail; // Return the normalized email
    }),
  body('password')
    .isLength({ min: 6 })
    .notEmpty()
    .withMessage('Password must be at least 6 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
  body('university')
    .isMongoId()
    .optional()
    .withMessage('University is not valid!'),
  body('roles')
    .trim()
    .notEmpty()
    .withMessage('Please specify user type')
    .isIn([ROLES.ADMIN, ROLES.LANDOWNER, ROLES.RESEARCHER, ROLES.UNIVERSITY])
    .withMessage(
      'Invalid role. Must be Admin, landowner, researcher, or university'
    ),
];

export const loginUserValidation = [
  body('email')
    .trim()
    .notEmpty()
    .isEmail()
    .withMessage('Valid email is required')
    .custom((value) => {
      // Normalize the email according to Gmail rules
      const normalizedEmail = normalizeEmailForGmail(value);
      return normalizedEmail; // Return the normalized email
    }),
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

export const updateProfileValidation = [
  body('roles')
    .optional()
    .trim()
    .isIn([ROLES.ADMIN, ROLES.LANDOWNER, ROLES.RESEARCHER, ROLES.UNIVERSITY])
    .withMessage(
      'Invalid role. Must be Admin, landowner, researcher, or university'
    ),
  body('name').optional().trim(),
  body('phone')
    .optional()
    .trim()
    .isLength({ min: 9, max: 15 })
    .withMessage('Phone number must be between 9 and 15 digits'),
];

export const getUsersInfoValidation = [
  query('role')
    .notEmpty()
    .withMessage('Please enter a valid user role!')
    .custom(async (value) => {
      const validRoles = enumToArray(ROLES);

      if (!validRoles.includes(value)) {
        throw new Error('Invalid role provided!');
      }

      if (value === ROLES.ADMIN) {
        throw new Error('Role cannot be super-admin!');
      }

      return true;
    }),
  query('isExport').optional().isBoolean().withMessage('Invalid export type!'),
];

export const updateUserPasswordValidation = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID format'),
  body('newPassword')
    .isLength({ min: 6 })
    .notEmpty()
    .withMessage('Password must be at least 6 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
];
