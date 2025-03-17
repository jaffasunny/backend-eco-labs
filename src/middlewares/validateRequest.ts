import { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { updateLandownerValidation } from '../utils/validations/landownerValidations.js';
import upload from './multer.js';

const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  next();
};

const uploadAndValidateRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Combine Multer and Validator middleware
  const uploadAndValidate = [
    upload.array('pdfFiles', 5),
    (req: Request, res: Response, next: NextFunction) => {
      // Ensure req.body is parsed correctly
      next();
    },
    updateLandownerValidation,
    validateRequest,
  ];
};

export { validateRequest, uploadAndValidateRequest };
