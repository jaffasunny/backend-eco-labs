import { Router } from 'express';
import {
  addLandowner,
  archiveLandowner,
  deleteLandowner,
  paginatedLandownerData,
  updateLandowner,
} from '../controllers/landowner.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import upload from '../middlewares/multer.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
  addLandownerValidation,
  archiveLandownerValidation,
  updateLandownerValidation,
} from '../utils/validations/landownerValidations.js';

const router = Router();

router.route('/').get(authMiddleware, paginatedLandownerData);

router
  .route('/add-landowner')
  .post(addLandownerValidation, validateRequest, authMiddleware, addLandowner);

router
  .route('/:id')
  .put(
    upload.array('files', 5),
    updateLandownerValidation,
    validateRequest,
    authMiddleware,
    updateLandowner
  )
  .delete(
    archiveLandownerValidation,
    validateRequest,
    authMiddleware,
    deleteLandowner
  );

router
  .route('/archive/:id')
  .patch(
    archiveLandownerValidation,
    validateRequest,
    authMiddleware,
    archiveLandowner
  );

export default router;
