import { ROLES } from './../constants';
import { Router } from 'express';
import {
  addLandowner,
  archiveLandowner,
  assignReport,
  deleteLandowner,
  paginatedLandownerData,
  paginatedReportData,
  updateLandowner,
} from '../controllers/landowner.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
  addLandownerValidation,
  archiveLandownerValidation,
  assignReportValidation,
  deleteLandownerValidation,
  updateLandownerValidation,
} from '../utils/validations/landownerValidations.js';
import { roleCheck } from '../middlewares/roles.middleware.js';
import landownerReportsRouter from './landownerReportRoute/landowner.reports.route.js';

const router = Router();

router
  .route('/')
  .get(authMiddleware, roleCheck(ROLES.LANDOWNER), paginatedLandownerData)
  .post(
    addLandownerValidation,
    validateRequest,
    authMiddleware,
    roleCheck(ROLES.LANDOWNER),
    addLandowner
  );

router.use('/reports', landownerReportsRouter);

router
  .route('/:id')
  .put(
    // upload.array('files', 5),
    updateLandownerValidation,
    validateRequest,
    authMiddleware,
    roleCheck(ROLES.LANDOWNER),
    updateLandowner
  )
  .delete(
    deleteLandownerValidation,
    validateRequest,
    authMiddleware,
    roleCheck(ROLES.LANDOWNER),
    deleteLandowner
  );

router
  .route('/archive/:id')
  .patch(
    archiveLandownerValidation,
    validateRequest,
    authMiddleware,
    roleCheck(ROLES.LANDOWNER),
    archiveLandowner
  );

export default router;
