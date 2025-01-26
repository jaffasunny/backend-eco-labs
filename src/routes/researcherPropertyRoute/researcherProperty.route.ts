import { Router } from 'express';
import { ROLES } from '../../constants.js';
import { addReports } from '../../controllers/researcher.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { mapFilesToBody } from '../../middlewares/index.middleware.js';
import upload from '../../middlewares/multer.js';
import { roleCheck } from '../../middlewares/roles.middleware.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { addReportsValidation } from '../../utils/validations/researcherValidations.js';

const router = Router();

router
  .route('/reports')
  .post(
    upload.array('files', 5),
    mapFilesToBody,
    addReportsValidation,
    validateRequest,
    authMiddleware,
    roleCheck(ROLES.RESEARCHER),
    addReports
  );

export default router;
