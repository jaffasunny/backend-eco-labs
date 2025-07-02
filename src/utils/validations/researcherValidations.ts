import { body, param } from 'express-validator';
import { PROPOSAL_STATUS, RESEARCHER_STATUS } from '../../constants.js';
import { User } from '../../models/user.model.js';
import { filesValidation } from './filesValidations.js';

export const placeBidResearchValidations = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Property ID is required')
    .isMongoId()
    .withMessage('Property ID must be a mongo id!'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Bid Descripton is required')
    .isLength({
      min: 12,
    }),
  body('status')
    .trim()
    .optional()
    .isIn([
      PROPOSAL_STATUS.APPROVED,
      PROPOSAL_STATUS.PENDING,
      PROPOSAL_STATUS.REJECTED,
    ])
    .withMessage(
      `Invalid status. Must be ${(PROPOSAL_STATUS.APPROVED,
        PROPOSAL_STATUS.PENDING,
        PROPOSAL_STATUS.REJECTED)
      }`
    ),
  ...filesValidation,
];

export const removeBidResearchValidations = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Bid ID is required')
    .isMongoId()
    .withMessage('Bid ID must be a mongo id!'),
];

export const addReportsValidation = [
  body('property')
    .trim()
    .notEmpty()
    .isMongoId()
    .withMessage('Invalid Property Id!'),
  body('name').trim().notEmpty().isString().withMessage('Invalid name!'),
  body('description')
    .trim()
    .notEmpty()
    .isString()
    .withMessage('Invalid description!'),
  ...filesValidation,
];

export const updateReportsValidation = [
  body('name').trim().isString().withMessage('Invalid name!'),
  body('description').trim().isString().withMessage('Invalid description!'),
  ...filesValidation,
];

export const changeResearchersStatusValidations = [
  param('id').trim().notEmpty().withMessage('Researcher ID is required'),
  body('status')
    .trim()
    .notEmpty()
    .withMessage('Please specify status')
    .isIn([
      RESEARCHER_STATUS.APPROVED,
      RESEARCHER_STATUS.PENDING,
      RESEARCHER_STATUS.REJECTED,
    ])
    .withMessage(
      `Invalid status. Must be ${(RESEARCHER_STATUS.APPROVED,
        RESEARCHER_STATUS.PENDING,
        RESEARCHER_STATUS.REJECTED)
      }`
    ),
];

export const deleteResearcherValidation = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Researcher Id is required')
    .isMongoId()
    .withMessage('Researcher id is not a mongo id!'),
];

export const archiveResearcherValidation = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Researcher Id is required')
    .isMongoId()
    .withMessage('Researcher id is not a mongo id!'),
];

export const updateResearcherValidation = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Researcher Id is required')
    .isMongoId()
    .withMessage('Researcher id is not a mongo id!'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage('Name must be at least 3 characters long'),
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

];

export const addResearcherValidation = [
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
  body('university')
    .trim()
    .notEmpty()
    .withMessage('University is required')
    .isMongoId()
    .withMessage('University is not valid!')
    .custom(async (value) => {
      let university = await User.findById(value);

      if (!university) {
        throw new Error('University is not valid!');
      }

      return true;
    }),
];
