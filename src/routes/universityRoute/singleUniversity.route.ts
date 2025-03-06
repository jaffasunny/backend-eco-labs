import { Router } from 'express';
import { ROLES } from '../../constants.js';
import {
  deleteUniversity,
  getPaginatedUniversityResearchers,
  getSingleUniversity,
  updateUniversity,
} from '../../controllers/university.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { roleCheck } from '../../middlewares/roles.middleware.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import {
  deleteUniversityValidation,
  getSingleUniversityValidation,
  updateUniversityValidation,
} from '../../utils/validations/universityValidations.js';

const router = Router({ mergeParams: true });

router
  .route('/')
  .get(
    getSingleUniversityValidation,
    validateRequest,
    authMiddleware,
    roleCheck([ROLES.ADMIN, ROLES.UNIVERSITY]),
    getSingleUniversity
  )
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
  .route('/researchers')
  .get(
    authMiddleware,
    roleCheck([ROLES.ADMIN, ROLES.UNIVERSITY]),
    getPaginatedUniversityResearchers
  );

export default router;
