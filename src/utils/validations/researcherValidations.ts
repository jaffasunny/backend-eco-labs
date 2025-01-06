import { body, param } from 'express-validator';
import { PROPOSAL_STATUS, RESEARCHER_STATUS } from '../../constants.js';

export const placeBidResearchValidations = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Landowner ID is required')
    .isMongoId()
    .withMessage('Landowner ID must be a mongo id!'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Bid Descripton is required')
    .isLength({
      min: 12,
    }),
  body('status')
    .trim()
    .notEmpty()
    .withMessage('Please specify status')
    .isIn([
      PROPOSAL_STATUS.APPROVED,
      PROPOSAL_STATUS.NOTSENT,
      PROPOSAL_STATUS.PENDING,
      PROPOSAL_STATUS.REJECTED,
    ])
    .withMessage(
      `Invalid status. Must be ${
        (PROPOSAL_STATUS.APPROVED,
        PROPOSAL_STATUS.NOTSENT,
        PROPOSAL_STATUS.PENDING,
        PROPOSAL_STATUS.REJECTED)
      }`
    ),
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
      `Invalid status. Must be ${
        (RESEARCHER_STATUS.APPROVED,
        RESEARCHER_STATUS.PENDING,
        RESEARCHER_STATUS.REJECTED)
      }`
    ),
];
