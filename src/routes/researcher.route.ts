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
  removeBidResearch,
} from '../controllers/researcher.controller.js';
import researcherPropertyRouter from './researcherPropertyRoute/researcherProperty.route.js';
import {
  addResearcherValidation,
  archiveResearcherValidation,
  changeResearchersStatusValidations,
  deleteResearcherValidation,
  placeBidResearchValidations,
  removeBidResearchValidations,
  updateResearcherValidation,
} from '../utils/validations/researcherValidations.js';
import { ROLES } from '../constants.js';
import upload from '../middlewares/multer.js';
import { mapFilesToBody } from '../middlewares/index.middleware.js';

const router = Router();

router
  .route('/')
  .get(
    authMiddleware,
    roleCheck([ROLES.LANDOWNER, ROLES.RESEARCHER, ROLES.UNIVERSITY]),
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
  .route('/researchReports/:researcherId')
  .get(
    authMiddleware,
    roleCheck(ROLES.RESEARCHER),
    paginatedResearcherReportData
  );

router.use('/properties', researcherPropertyRouter);

router
  .route('/:id')
  .get(
    authMiddleware,
    fetchResearcher
  )
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
    upload.array('files', 20),
    mapFilesToBody,
    placeBidResearchValidations,
    validateRequest,
    authMiddleware,
    roleCheck(ROLES.RESEARCHER),
    placeBidResearch
  )
  .delete(
    removeBidResearchValidations,
    validateRequest,
    authMiddleware,
    roleCheck(ROLES.RESEARCHER),
    removeBidResearch
  );

export default router;
