import { ROLES } from '../constants.js';
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { roleCheck } from '../middlewares/roles.middleware.js';
import {
  addPropertyValidation,
  propertyFilesValidation,
} from '../utils/validations/propertyValidations.js';
import {
  addProperty,
  removeFiles,
} from '../controllers/property.controller.js';
import upload from '../middlewares/multer.js';
import { mapFilesToBody } from '../middlewares/index.middleware.js';

const router = Router();

router
  .route('/')
  .post(
    upload.array('files', 5),
    mapFilesToBody,
    addPropertyValidation,
    validateRequest,
    authMiddleware,
    roleCheck(ROLES.LANDOWNER),
    addProperty
  );

router
  .route('/files/:fileId')
  .delete(
    propertyFilesValidation,
    validateRequest,
    authMiddleware,
    roleCheck(ROLES.LANDOWNER),
    removeFiles
  );

export default router;
