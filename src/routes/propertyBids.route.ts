import { ROLES } from '../constants.js';
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleCheck } from '../middlewares/roles.middleware.js';
import { getSingleBid } from '../controllers/property.controller.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { getSingleBidValidation } from '../utils/validations/propertyValidations.js';

const router = Router();

router
  .route('/:id')
  .get(
    getSingleBidValidation,
    validateRequest,
    authMiddleware,
    roleCheck([ROLES.LANDOWNER, ROLES.RESEARCHER]),
    getSingleBid
  );

export default router;
