import { Router } from 'express';
import {
  addLandowner,
  paginatedLandownerData,
  updateLandowner,
} from '../controllers/landowner.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import upload from '../middlewares/multer';
import { validateRequest } from '../middlewares/validateRequest';
import {
  addLandownerValidation,
  updateLandownerValidation,
} from '../utils/validations/landownerValidations';

const router = Router();

router
  .route('/add-landowner')
  .post(addLandownerValidation, validateRequest, authMiddleware, addLandowner);

router
  .route('/landowners/:id')
  .put(
    upload.array('files', 5),
    updateLandownerValidation,
    validateRequest,
    authMiddleware,
    updateLandowner
  );

router.route('/landowners').get(authMiddleware, paginatedLandownerData);

export default router;
