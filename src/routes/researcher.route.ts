import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { roleCheck } from '../middlewares/roles.middleware.js';
import {
  placeBidResearch,
  paginatedResearcherReportData,
} from '../controllers/researcher.controller.js';
import { placeBidResearchValidations } from '../utils/validations/researcherValidations.js';

const router = Router();

router
  .route('/')
  .get(authMiddleware, roleCheck('researcher'), paginatedResearcherReportData);

router
  .route('/bid/:id')
  .post(
    placeBidResearchValidations,
    validateRequest,
    authMiddleware,
    roleCheck('researcher'),
    placeBidResearch
  );

export default router;
