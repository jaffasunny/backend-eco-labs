import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { roleCheck } from '../middlewares/roles.middleware.js';
import {
  deleteReport,
  getReport,
  paginatedReports,
} from '../controllers/report.controller.js';

const router = Router();

router
  .route('/')
  .get(
    authMiddleware,
    roleCheck(['landowner', 'researcher']),
    paginatedReports
  );

router
  .route('/:id')
  .delete(authMiddleware, roleCheck('landowner'), deleteReport)
  .get(authMiddleware, roleCheck('landowner'), getReport);

export default router;
