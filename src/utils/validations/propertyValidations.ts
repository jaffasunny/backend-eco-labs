import { body, param, query } from 'express-validator';
import { Property } from '../../models/property.model.js';
import { User } from '../../models/user.model.js';
import { findModel } from '../../services/index.service.js';
import { ApiError } from '../ApiError.js';
import { filesValidation } from './filesValidations.js';

export const addPropertyValidation = [
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
  body('landownerId')
    .notEmpty()
    .isMongoId()
    .withMessage('Please enter a valid Landowner Id')
    .custom(async (value) => {
      const result = await findModel(User, { _id: value });

      if (!result) {
        return Promise.reject('User does not exist!');
      }

      return true;
    }),
  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date (YYYY-MM-DD)')
    .custom((value) => {
      const currentDate = new Date();
      const inputDate = new Date(value);

      if (inputDate < currentDate) {
        throw new Error('Start date cannot be in the past');
      }
      return true;
    }),

  // Custom validation for files (if needed)
  ...filesValidation,
];

export const propertyFilesValidation = [
  param('fileId').notEmpty().withMessage('Please enter a valid File Id'),
  query('propertyFilesId')
    .notEmpty()
    .isMongoId()
    .withMessage('Please enter a valid Property Files Id'),
];

export const assignResearcherPropertyValidation = [
  body('propertyId')
    .notEmpty()
    .withMessage('Property Id is required!')
    .isMongoId()
    .withMessage('Property Id must be a valid MongoDB ObjectId.'),
  body('researcherId')
    .notEmpty()
    .withMessage('Researcher Id is required!')
    .isMongoId()
    .withMessage('Researcher Id must be a valid MongoDB ObjectId.'),
];

export const deletePropertyValidation = [
  param('id')
    .notEmpty()
    .withMessage('Property Id is required!')
    .isMongoId()
    .withMessage('Property Id must be a valid MongoDB ObjectId.'),
];

export const assignedResearchersToPropertyValidation = [
  query('propertyId')
    .notEmpty()
    .withMessage('Property Id is required!')
    .isMongoId()
    .withMessage('Property Id must be a valid MongoDB ObjectId.')
    .custom(async (value) => {
      const property = await Property.findById(value);

      if (!property) {
        return new ApiError(401, `Property not found!`);
      }

      return true;
    }),
];

export const researcherSubmittedReportsValidation = [
  query('propertyId')
    .notEmpty()
    .withMessage('Property Id is required!')
    .isMongoId()
    .withMessage('Property Id must be a valid MongoDB ObjectId.')
    .custom(async (value) => {
      const property = await Property.findById(value);

      if (!property) {
        return new ApiError(401, `Property not found!`);
      }

      return true;
    }),
  param('researcherId')
    .notEmpty()
    .withMessage('Property Id is required!')
    .isMongoId()
    .withMessage('Property Id must be a valid MongoDB ObjectId.')
    .custom(async (value) => {
      const researcher = await User.findById(value);

      if (!researcher) {
        return new ApiError(401, `Researcher not found!`);
      }

      return true;
    }),
];

export const getSingleBidValidation = [
  param('id')
    .notEmpty()
    .withMessage('Bid Id is required!')
    .isMongoId()
    .withMessage('Bid Id must be a valid MongoDB ObjectId.'),
];
