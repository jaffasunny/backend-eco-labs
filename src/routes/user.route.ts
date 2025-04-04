import { Router } from 'express';
import {
  loginUser,
  logoutUser,
  registerUser,
  sendResetPasswordToken,
  verifyResetPasswordOTP,
  resetPassword,
  updateUserProfile,
  checkPassword,
} from '../controllers/user.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
  loginUserValidation,
  registerUserValidation,
  updateProfileValidation,
} from './../utils/validations/userValidations.js';

const router = Router();

router
  .route('/register')
  .post(registerUserValidation, validateRequest, registerUser);
router.route('/login').post(loginUserValidation, validateRequest, loginUser);
router.route('/logout').post(logoutUser);
router
  .route('/profile-update')
  .put(
    updateProfileValidation,
    validateRequest,
    authMiddleware,
    updateUserProfile
  );

router.get('/check-password', authMiddleware, checkPassword);
// reset password
router.post('/getResetPassword', sendResetPasswordToken); // get reset password token
router.post('/verifyResetPasswordOtp', verifyResetPasswordOTP); // verify reset password token
router.post('/reset-password', resetPassword); // reset password

export default router;
