import { Router } from 'express';
import { ROLES } from '../../constants.js';
import {
  assignReport,
  changeResearchersBidStatus,
  paginatedPropertyBidsData,
  paginatedPropertyData,
} from '../../controllers/landowner.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { roleCheck } from '../../middlewares/roles.middleware.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import {
  assignReportValidation,
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
  .route('/assignReport')
  .patch(
    assignReportValidation,
    validateRequest,
    authMiddleware,
    roleCheck(ROLES.ADMIN),
    assignReport
  );

router
  .route('/researcherStatus/:id')
  .patch(
    changeResearcherBidStatusValidation,
    validateRequest,
    authMiddleware,
    roleCheck(ROLES.LANDOWNER),
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
