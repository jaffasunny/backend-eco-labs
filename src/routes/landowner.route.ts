import { Router } from 'express';
import {
  addLandowner,
  updateLandowner,
} from '../controllers/landowner.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import upload from '../middlewares/multer';
import {
  uploadAndValidateRequest,
  validateRequest,
} from '../middlewares/validateRequest';
import {
  addLandownerValidation,
  updateLandownerValidation,
} from '../utils/validations/landownerValidations';

const router = Router();

router
  .route('/add-landowner')
  .post(
    uploadAndValidateRequest,
    validateRequest,
    authMiddleware,
    addLandowner
  );

router.route('/landowner').put(
  // updateLandownerValidation,
  // validateRequest,
  authMiddleware,
  upload.single('file'),
  updateLandowner
);

export default router;
