import { body, param, query } from 'express-validator';
import { PROPOSAL_STATUS } from '../../constants.js';
import { filesValidation } from './filesValidations.js';
import { reportsValidation } from './reportsValidations.js';

export const addLandownerValidation = [
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
    .custom((value) => {
      // Remove all non-digit characters
      const digits = value.replace(/[^\d]/g, '');

      // Check if the cleaned value contains only digits
      if (!/^\d+$/.test(digits)) {
        throw new Error('Phone number must be numeric');
      }

      // Validate length (10–15 digits)
      if (digits.length < 9 || digits.length > 15) {
        throw new Error('Phone number must be between 10 and 15 digits');
      }

      return true;
    }),
  body('startDate').notEmpty().withMessage('Start date is required'),

  ...filesValidation,
];

export const getLandownerValidation = [
  param('id').notEmpty().isMongoId().withMessage('Invalid Id!'),
];

export const updateLandownerValidation = [
  param('id').notEmpty().isMongoId().withMessage('Invalid Id!'),
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
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
];

export const paginatedPropertyValidation = [
  param('id')
    .optional()
    .trim()
    .isMongoId()
    .withMessage('Is not a valid Mongo Id'),
];

export const assignReportValidation = [
  body('property').trim().isMongoId().withMessage('Is not a valid Mongo Id'),

  ...reportsValidation.map((validation) => validation.optional()),
];

export const deleteLandownerValidation = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Landowner Id is required')
    .isMongoId()
    .withMessage('Landowner id is not a mongo id!'),
];

export const archiveLandownerValidation = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Landowner Id is required')
    .isMongoId()
    .withMessage('Landowner id is not a mongo id!'),
];

export const changeResearcherBidStatusValidation = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Bid Id is required')
    .isMongoId()
    .withMessage('Bid Id must be a mongo id'),
  body('researcherId')
    .trim()
    .notEmpty()
    .withMessage('Researcher is required')
    .isMongoId()
    .withMessage('Researcher must be a mongo id'),
  body('assignDate').trim().notEmpty().withMessage('Researcher is required'),
  body('status')
    .trim()
    .notEmpty()
    .withMessage('Please specify status')
    .isIn([
      PROPOSAL_STATUS.APPROVED,
      PROPOSAL_STATUS.PENDING,
      PROPOSAL_STATUS.REJECTED,
    ])
    .withMessage(
      `Invalid status. Must be ${
        (PROPOSAL_STATUS.APPROVED,
        PROPOSAL_STATUS.PENDING,
        PROPOSAL_STATUS.REJECTED)
      }`
    ),
];

export const paginatedPropertyBidsValidation = [
  query('propertyId')
    .trim()
    .notEmpty()
    .withMessage('Property Id is required')
    .isMongoId()
    .withMessage('Property Id must be a mongo id'),
];

export const updateLandownerNoteValidation = [
  param('id')
    .notEmpty()
    .withMessage('Landowner Id is required!')
    .isMongoId()
    .withMessage('Landowner Id must be a valid MongoDB ObjectId.')
    .custom(async (value) => {
      const { User } = await import('../../models/user.model.js');
      const landowner = await User.findById(value);

      if (!landowner) {
        return Promise.reject('Landowner not found!');
      }

      if (landowner.roles !== 'landowner') {
        return Promise.reject('User is not a landowner!');
      }

      return true;
    }),
  body('note')
    .notEmpty()
    .withMessage('Note is required!')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Note must be between 1 and 1000 characters long'),
];
