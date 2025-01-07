import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { roleCheck } from '../middlewares/roles.middleware.js';
import {
  placeBidResearch,
  paginatedResearcherReportData,
  paginatedResearchers,
  changeResearchersStatus,
  updateResearcher,
  deleteResearcher,
  archiveResearcher,
} from '../controllers/researcher.controller.js';
import {
  archiveResearcherValidation,
  changeResearchersStatusValidations,
  deleteResearcherValidation,
  placeBidResearchValidations,
  updateResearcherValidation,
} from '../utils/validations/researcherValidations.js';
import { ROLES } from '../constants.js';

const router = Router();

router
  .route('/')
  .get(authMiddleware, roleCheck('researcher'), paginatedResearchers);

router
  .route('/:id')
  .patch(
    changeResearchersStatusValidations,
    validateRequest,
    authMiddleware,
    roleCheck(ROLES.ADMIN),
    changeResearchersStatus
  )
  .delete(
    deleteResearcherValidation,
    validateRequest,
    authMiddleware,
    roleCheck(ROLES.ADMIN),
    deleteResearcher
  );

router
  .route('/:id/update')
  .patch(
    updateResearcherValidation,
    validateRequest,
    authMiddleware,
    roleCheck(ROLES.ADMIN),
    updateResearcher
  );

router
  .route('/archive/:id')
  .patch(
    archiveResearcherValidation,
    validateRequest,
    authMiddleware,
    roleCheck(ROLES.ADMIN),
    archiveResearcher
  );

router
  .route('/researchReports')
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
