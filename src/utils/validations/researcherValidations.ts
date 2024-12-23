import { body, param } from 'express-validator';
import { PROPOSAL_STATUS } from '../../constants';

export const placeBidResearchValidations = [
  param('id').trim().notEmpty().withMessage('Landowner Id is required'),
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
