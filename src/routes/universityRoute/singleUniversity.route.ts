import { Router } from 'express';
import { ROLES } from '../../constants.js';
import {
  deleteUniversity,
  getPaginatedUniversityResearchers,
  updateUniversity,
} from '../../controllers/university.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { roleCheck } from '../../middlewares/roles.middleware.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import {
  deleteUniversityValidation,
  updateUniversityValidation,
} from '../../utils/validations/universityValidations.js';

const router = Router({ mergeParams: true });

router
  .route('/')
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
    roleCheck(ROLES.ADMIN),
    getPaginatedUniversityResearchers
  );

export default router;
