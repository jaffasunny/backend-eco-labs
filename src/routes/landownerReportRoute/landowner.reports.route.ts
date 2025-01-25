import { Router } from 'express';
import { ROLES } from '../../constants.js';
import {
  assignReport,
  paginatedReportData,
} from '../../controllers/landowner.controller.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { roleCheck } from '../../middlewares/roles.middleware.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { assignReportValidation } from '../../utils/validations/landownerValidations.js';

const router = Router();

router
  .route('/')
  .get(authMiddleware, roleCheck([ROLES.LANDOWNER]), paginatedReportData);

router
  .route('/assignReport')
  .patch(
    assignReportValidation,
    validateRequest,
    authMiddleware,
    roleCheck(ROLES.ADMIN),
    assignReport
  );

// router
//   .route('/bids')
//   .get(
//     paginatedReportsBidsValidation,
//     validateRequest,
//     authMiddleware,
//     roleCheck(ROLES.LANDOWNER),
//     paginatedReportBidsData
//   );

export default router;
