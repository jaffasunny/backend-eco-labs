import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleCheck } from '../middlewares/roles.middleware.js';
import {
  deleteReport,
  getReport,
  paginatedReports,
} from '../controllers/report.controller.js';
import { ROLES } from '../constants.js';

const router = Router();

router
  .route('/')
  .get(
    authMiddleware,
    roleCheck([ROLES.LANDOWNER, ROLES.RESEARCHER]),
    paginatedReports
  );

router
  .route('/:id')
  .delete(authMiddleware, roleCheck([ROLES.LANDOWNER]), deleteReport)
  .get(
    authMiddleware,
    roleCheck([ROLES.LANDOWNER, ROLES.RESEARCHER]),
    getReport
  );

export default router;
