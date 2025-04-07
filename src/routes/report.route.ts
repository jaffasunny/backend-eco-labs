import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleCheck } from '../middlewares/roles.middleware.js';
import {
  getReport,
  toggleArchiveReport,
} from '../controllers/report.controller.js';
import { ROLES } from '../constants.js';
import { getReportValidation } from '../utils/validations/reportsValidations.js';
import { validateRequest } from '../middlewares/validateRequest.js';

const router = Router();

router
  .route('/:id/toggle-archive')
  .post(authMiddleware, roleCheck([ROLES.ADMIN]), toggleArchiveReport);

router
  .route('/:id')
  .get(getReportValidation, validateRequest, authMiddleware, getReport);

export default router;
