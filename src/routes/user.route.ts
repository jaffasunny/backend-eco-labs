import { Router } from 'express';
import { loginUser, registerUser } from '../controllers/user.controller.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
  loginUserValidation,
  registerUserValidation,
} from './../utils/validations/userValidations.js';

const router = Router();

// auth
// router.route("/register").post(upload.single("file"), registerUser);
router
  .route('/register')
  .post(registerUserValidation, validateRequest, registerUser);
router.route('/login').post(loginUserValidation, validateRequest, loginUser);

export default router;
