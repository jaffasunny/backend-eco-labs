import { Router } from 'express';
import {
  addLandowner,
  archiveLandowner,
  deleteLandowner,
  paginatedLandownerData,
  paginatedReportData,
  updateLandowner,
} from '../controllers/landowner.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import upload from '../middlewares/multer.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
  addLandownerValidation,
  archiveLandownerValidation,
  deleteLandownerValidation,
  updateLandownerValidation,
} from '../utils/validations/landownerValidations.js';
import { roleCheck } from '../middlewares/roles.middleware.js';

const router = Router();

router
  .route('/')
  .get(authMiddleware, roleCheck('landowner'), paginatedLandownerData);

router
  .route('/reports')
  .get(authMiddleware, roleCheck('landowner'), paginatedReportData);

router
  .route('/add-landowner')
  .post(
    addLandownerValidation,
    validateRequest,
    authMiddleware,
    roleCheck('landowner'),
    addLandowner
  );

router
  .route('/:id')
  .put(
    upload.array('files', 5),
    updateLandownerValidation,
    validateRequest,
    authMiddleware,
    roleCheck('landowner'),
    updateLandowner
  )
  .delete(
    deleteLandownerValidation,
    validateRequest,
    authMiddleware,
    roleCheck('landowner'),
    deleteLandowner
  );

router
  .route('/archive/:id')
  .patch(
    archiveLandownerValidation,
    validateRequest,
    authMiddleware,
    roleCheck('landowner'),
    archiveLandowner
  );

export default router;
