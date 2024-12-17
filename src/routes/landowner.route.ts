import { Router } from 'express';
import { addLandowner } from '../controllers/landowner.controller';
import { validateRequest } from '../middlewares/validateRequest';
import { addLandownerValidation } from '../utils/validations/userValidations';

const router = Router();

router
  .route('/add-landowner')
  .post(addLandownerValidation, validateRequest, addLandowner);

export default router;
