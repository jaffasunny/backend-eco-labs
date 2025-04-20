import { Router } from 'express';
import { ROLES } from '../../constants.js';
import {
  addReports,
  checkResearcherProposalStatus,
  updateReport,
} from '../../controllers/researcher.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { mapFilesToBody } from '../../middlewares/index.middleware.js';
import upload from '../../middlewares/multer.js';
import { roleCheck } from '../../middlewares/roles.middleware.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import {
  addReportsValidation,
  updateReportsValidation,
} from '../../utils/validations/researcherValidations.js';

const router = Router();

router.route('/:id').get(authMiddleware, checkResearcherProposalStatus);

router
  .route('/reports')
  .post(
    upload.array('files', 20),
    mapFilesToBody,
    addReportsValidation,
    validateRequest,
    authMiddleware,
    roleCheck(ROLES.RESEARCHER),
    addReports
  );

router
  .route('/reports/:id')
  .patch(
    upload.array('files', 20),
    mapFilesToBody,
    updateReportsValidation,
    validateRequest,
    authMiddleware,
    roleCheck(ROLES.RESEARCHER),
    updateReport
  );

export default router;
