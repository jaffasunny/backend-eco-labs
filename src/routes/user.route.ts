import { Router } from 'express';
import {
  loginUser,
  logoutUser,
  registerUser,
  sendResetPasswordToken,
  verifyResetPasswordOTP,
  resetPassword,
} from '../controllers/user.controller.js';
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
router.route('/logout').post(logoutUser);

// reset password
router.post('/getResetPassword', sendResetPasswordToken); // get reset password token
router.post('/verifyResetPasswordOtp', verifyResetPasswordOTP); // verify reset password token
router.post('/reset-password', resetPassword); // reset password

export default router;
