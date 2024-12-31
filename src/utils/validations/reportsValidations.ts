import { body, check, param } from 'express-validator';

export const reportsValidation = [
  // Validate email
  body('landAssessmentReport')
    .isArray({ min: 1 })
    .withMessage('there must be at least one report')
    .custom((value) => {
      if (!Array.isArray(value)) false;

      return value.every(
        (report: { url: string; name: string }) => report.url && report.name
      );
    })
    .withMessage('Each report must include url and name!'),
  body('landAssessmentReport.*.url')
    .isString()
    .withMessage('Each report URL must be a string.')
    .notEmpty()
    .withMessage('Each report URL is required.'),
  body('landAssessmentReport.*.name')
    .isString()
    .withMessage('Each report name must be a string.')
    .notEmpty()
    .withMessage('Each report name is required.'),
  body('property')
    .optional()
    .isMongoId()
    .withMessage('Property must be a valid MongoDB ObjectId.'),
];
