import { check, CustomValidator } from 'express-validator';

export const validateFiles: CustomValidator = (value, { req }) => {
  if (req.files && req.files.length) {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
    ];
    const maxSize = 10 * 1024 * 1024; // 2MB per file
    for (const file of req.files) {
      if (!allowedTypes.includes(file.mimetype)) {
        throw new Error(
          `Invalid file type for file ${file.originalname}. Only PDF, DOC, DOCX, JPEG, PNG, and GIF are allowed.`
        );
      }
      if (file.size > maxSize) {
        throw new Error(
          `File size for ${file.originalname} exceeds the 10MB limit.`
        );
      }
    }
  }
  return true;
};

export const filesValidation = [check('files').custom(validateFiles)];
