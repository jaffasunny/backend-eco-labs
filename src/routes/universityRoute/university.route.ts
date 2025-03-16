import { ROLES } from '../../constants.js';
import { Router } from 'express';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { roleCheck } from '../../middlewares/roles.middleware.js';
import {
  addUniversity,
  archiveUniversity,
  paginatedUniversityData,
} from '../../controllers/university.controller.js';
import {
  addUniversityValidation,
  archiveUniversityValidation,
} from '../../utils/validations/universityValidations.js';
import universityReportsRouter from '../universityReportRoute/university.reports.route.js';
import singleUniversityRoute from './singleUniversity.route.js';

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

router.use('/:id', singleUniversityRoute);

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
