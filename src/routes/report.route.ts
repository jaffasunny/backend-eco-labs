import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleCheck } from '../middlewares/roles.middleware.js';
import {
  assignResearcherReport,
  deleteReport,
  getReport,
  paginatedAssignedResearcherReports,
  paginatedReports,
} from '../controllers/report.controller.js';
import { ROLES } from '../constants.js';
import {
  assignResearcherReportValidation,
  deleteReportValidation,
} from '../utils/validations/reportsValidations.js';
import { validateRequest } from '../middlewares/validateRequest.js';

const router = Router();

router
  .route('/')
  .get(
    authMiddleware,
    roleCheck([ROLES.LANDOWNER, ROLES.RESEARCHER]),
    paginatedReports
  );

router
  .route('/assignedResearcherReports')
  .get(
    authMiddleware,
    roleCheck([ROLES.ADMIN, ROLES.RESEARCHER]),
    paginatedAssignedResearcherReports
  );

router
  .route('/:id')
  .delete(
    deleteReportValidation,
    validateRequest,
    authMiddleware,
    roleCheck([ROLES.LANDOWNER]),
    deleteReport
  )
  .get(
    authMiddleware,
    roleCheck([ROLES.LANDOWNER, ROLES.RESEARCHER]),
    getReport
  );

router
  .route('/assignResearcherReport')
  .post(
    assignResearcherReportValidation,
    validateRequest,
    authMiddleware,
    roleCheck([ROLES.ADMIN]),
    assignResearcherReport
  );

export default router;
