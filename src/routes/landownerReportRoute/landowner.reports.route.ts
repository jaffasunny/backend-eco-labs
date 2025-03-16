import { Router } from 'express';
import { ROLES } from '../../constants.js';
import { assignReport } from '../../controllers/landowner.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { roleCheck } from '../../middlewares/roles.middleware.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { assignReportValidation } from '../../utils/validations/landownerValidations.js';

const router = Router();

router
  .route('/assignReport')
  .patch(
    assignReportValidation,
    validateRequest,
    authMiddleware,
    roleCheck(ROLES.ADMIN),
    assignReport
  );

export default router;
