import { ROLES } from '../constants.js';
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { roleCheck } from '../middlewares/roles.middleware.js';
import { addPropertyValidation } from '../utils/validations/propertyValidations.js';
import { addProperty } from '../controllers/property.controller.js';

const router = Router();

router
  .route('/')
  .post(
    addPropertyValidation,
    validateRequest,
    authMiddleware,
    roleCheck(ROLES.LANDOWNER),
    addProperty
  );

export default router;
