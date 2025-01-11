import { ROLES } from '../constants.js';
import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { roleCheck } from '../middlewares/roles.middleware.js';
import {
  addUniversity,
  archiveUniversity,
  deleteUniversity,
  paginatedUniversityData,
  updateUniversity,
} from '../controllers/university.controller.js';
import {
  addUniversityValidation,
  archiveUniversityValidation,
  deleteUniversityValidation,
  updateUniversityValidation,
} from '../utils/validations/universityValidations.js';
import universityReportsRouter from './universityReportRoute/university.reports.route.js';

const router = Router();

router
  .route('/')
  .get(
    authMiddleware,
    roleCheck([ROLES.LANDOWNER, ROLES.UNIVERSITY]),
    paginatedUniversityData
  )
  .post(
    addUniversityValidation,
    validateRequest,
    authMiddleware,
    roleCheck(ROLES.ADMIN),
    addUniversity
  );

router.use('/reports', universityReportsRouter);

router
  .route('/:id')
  .patch(
    updateUniversityValidation,
    validateRequest,
    authMiddleware,
    roleCheck(ROLES.ADMIN),
    updateUniversity
  )
  .delete(
    deleteUniversityValidation,
    validateRequest,
    authMiddleware,
    roleCheck(ROLES.ADMIN),
    deleteUniversity
  );

router
  .route('/archive/:id')
  .patch(
    archiveUniversityValidation,
    validateRequest,
    authMiddleware,
    roleCheck(ROLES.ADMIN),
    archiveUniversity
  );

export default router;
