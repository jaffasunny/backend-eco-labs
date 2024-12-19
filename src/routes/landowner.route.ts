import { Router } from 'express';
import {
  addLandowner,
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
  .route('/landowner')
  .put(
    upload.array('files', 5),
    updateLandownerValidation,
    validateRequest,
    authMiddleware,
    updateLandowner
  );

export default router;
