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
  addResearcher,
  fetchResearcher,
} from '../controllers/researcher.controller.js';
import {
  addResearcherValidation,
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
  .get(
    authMiddleware,
    roleCheck([ROLES.LANDOWNER, ROLES.RESEARCHER]),
    paginatedResearchers
  )
  .post(
    addResearcherValidation,
    validateRequest,
    authMiddleware,
    roleCheck([ROLES.ADMIN]),
    addResearcher
  );

router
  .route('/researchReports')
  .get(authMiddleware, roleCheck('researcher'), paginatedResearcherReportData);

router
  .route('/:id')
  .get(authMiddleware, roleCheck(ROLES.RESEARCHER), fetchResearcher)
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
  .route('/bid/:id')
  .post(
    placeBidResearchValidations,
    validateRequest,
    authMiddleware,
    roleCheck(ROLES.RESEARCHER),
    placeBidResearch
  );

export default router;
