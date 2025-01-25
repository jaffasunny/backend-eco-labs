import { ROLES } from './../constants.js';
import { Router } from 'express';
import {
  addLandowner,
  archiveLandowner,
  deleteLandowner,
  paginatedLandownerData,
  updateLandowner,
} from '../controllers/landowner.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
  addLandownerValidation,
  archiveLandownerValidation,
  deleteLandownerValidation,
  updateLandownerValidation,
} from '../utils/validations/landownerValidations.js';
import { roleCheck } from '../middlewares/roles.middleware.js';
import landownerReportsRouter from './landownerReportRoute/landowner.reports.route.js';
import landownerPropertyRouter from './landownerPropertyRoute/landowner.properties.route.js';
import upload from '../middlewares/multer.js';
import { mapFilesToBody } from '../middlewares/index.middleware.js';

const router = Router();

router
  .route('/')
  .get(authMiddleware, roleCheck(ROLES.LANDOWNER), paginatedLandownerData)
  .post(
    upload.array('files', 5),
    mapFilesToBody,
    addLandownerValidation,
    validateRequest,
    authMiddleware,
    roleCheck(ROLES.LANDOWNER),
    addLandowner
  );

router.use('/reports', landownerReportsRouter);

router.use('/properties', landownerPropertyRouter);

router
  .route('/:id')
  .put(
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
