import { Router } from 'express';
import {
  addLandowner,
  archiveLandowner,
  paginatedLandownerData,
  updateLandowner,
} from '../controllers/landowner.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import upload from '../middlewares/multer';
import { validateRequest } from '../middlewares/validateRequest';
import {
  addLandownerValidation,
  archiveLandownerValidation,
  updateLandownerValidation,
} from '../utils/validations/landownerValidations';

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
