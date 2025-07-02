import { body, param, query } from 'express-validator';
import { reportsValidation } from './reportsValidations.js';

export const addUniversityValidation = [
  // Validate email
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 3 })
    .withMessage('Name must be at least 3 characters long'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .isLength({ min: 9, max: 15 })
    .withMessage('Phone number must be between 9 and 15 digits'),
  body('contactName')
    .trim()
    .notEmpty()
    .withMessage('Contact Name is required')
    .isLength({ min: 3 })
    .withMessage('Contact Name must be at least 3 characters long'),
];

export const updateUniversityValidation = [
  param('id').notEmpty().isMongoId().withMessage('Invalid Country Id'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage('Name must be at least 3 characters long'),
  body('propertyName')
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage('Property Name must be at least 3 characters long'),
  body('propertyLocation')
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage('Property Location must be at least 3 characters long'),
  body('propertySize')
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage('Property Size must be at least 3 characters long'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('phone')
    .optional()
    .trim()
    .isLength({ min: 9, max: 15 })
    .withMessage('Phone number must be between 9 and 15 digits'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  ...reportsValidation.map((validation) => validation.optional()),
];

export const getSingleUniversityValidation = [
  param('id').notEmpty().isMongoId().withMessage('Invalid University Id'),
];

export const assignReportValidation = [
  body('property').trim().isMongoId().withMessage('Is not a valid Mongo Id'),

  ...reportsValidation.map((validation) => validation.optional()),
];

export const deleteUniversityValidation = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Landowner Id is required')
    .isMongoId()
    .withMessage('Landowner id is not a mongo id!'),
];

export const archiveUniversityValidation = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Landowner Id is required')
    .isMongoId()
    .withMessage('Landowner id is not a mongo id!'),
];
