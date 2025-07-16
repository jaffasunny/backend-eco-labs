import { Router } from 'express';
import { ROLES } from '../../constants.js';
import {
  changeResearchersBidStatus,
  paginatedPropertyBidsData,
  paginatedPropertyData,
} from '../../controllers/landowner.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { roleCheck } from '../../middlewares/roles.middleware.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import {
  changeResearcherBidStatusValidation,
  paginatedPropertyBidsValidation,
  paginatedPropertyValidation,
} from '../../utils/validations/landownerValidations.js';

const router = Router();

router
  .route('/')
  .get(
    paginatedPropertyValidation,
    validateRequest,
    authMiddleware,
    roleCheck([ROLES.LANDOWNER]),
    paginatedPropertyData
  );

router
  .route('/researcherStatus/:id')
  .patch(
    changeResearcherBidStatusValidation,
    validateRequest,
    authMiddleware,
    roleCheck([ROLES.ADMIN, ROLES.LANDOWNER]),
    changeResearchersBidStatus
  );

router
  .route('/bids')
  .get(
    paginatedPropertyBidsValidation,
    validateRequest,
    authMiddleware,
    roleCheck(ROLES.LANDOWNER),
    paginatedPropertyBidsData
  );

export default router;
