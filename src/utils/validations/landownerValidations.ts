import { body, check, param } from 'express-validator';
import { reportsValidation } from './reportsValidations';

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
    .isNumeric()
    .withMessage('Phone number must be numeric')
    .isLength({ min: 10, max: 15 })
    .withMessage('Phone number must be between 10 and 15 digits'),
];

export const updateLandownerValidation = [
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
    .isNumeric()
    .withMessage('Phone number must be numeric')
    .isLength({ min: 10, max: 15 })
    .withMessage('Phone number must be between 10 and 15 digits'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
    
  ...reportsValidation.map((validation) => validation.optional()),

  // Custom validation for files (if needed)
  // check('files').optional().custom((value, { req }) => {
  //   if (req.files && req.files.length) {
  //     const allowedTypes = [
  //       'application/pdf',
  //       'application/msword',
  //       'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  //     ];
  //     const maxSize = 2 * 1024 * 1024; // 2MB per file
  //     for (const file of req.files) {
  //       if (!allowedTypes.includes(file.mimetype)) {
  //         throw new Error(
  //           `Invalid file type for file ${file.originalname}. Only PDF, DOC, and DOCX are allowed.`
  //         );
  //       }
  //       if (file.size > maxSize) {
  //         throw new Error(
  //           `File size for ${file.originalname} exceeds the 2MB limit.`
  //         );
  //       }
  //     }
  //   }
  //   return true;
  // }),
];


export const deleteLandownerValidation = [
  param('id').trim().notEmpty().withMessage('Landowner Id is required'),
];

export const archiveLandownerValidation = [
  param('id').trim().notEmpty().withMessage('Landowner Id is required'),
];
