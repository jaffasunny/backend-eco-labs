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
  getUsersInfo,
  updateUserPassword,
} from '../controllers/user.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
  getUsersInfoValidation,
  loginUserValidation,
  registerUserValidation,
  updateProfileValidation,
  updateUserPasswordValidation,
} from './../utils/validations/userValidations.js';
import { roleCheck } from '../middlewares/roles.middleware.js';
import { ROLES } from '../constants.js';

const router = Router();

router.get(
  '/',
  getUsersInfoValidation,
  validateRequest,
  authMiddleware,
  roleCheck([ROLES.ADMIN]),
  getUsersInfo
); // get user info by specified role
router
  .route('/register')
  .post(registerUserValidation, validateRequest, registerUser); // user signup
router.route('/login').post(loginUserValidation, validateRequest, loginUser); // user login
router.route('/logout').post(logoutUser); // user logout
router
  .route('/profile-update')
  .put(
    updateProfileValidation,
    validateRequest,
    authMiddleware,
    updateUserProfile
  ); // user profile update

router.get('/check-password', authMiddleware, checkPassword); // match new password with old password
router.post('/getResetPassword', sendResetPasswordToken); // get reset password token
router.post('/verifyResetPasswordOtp', verifyResetPasswordOTP); // verify reset password token
router.post('/reset-password', resetPassword); // reset password

// Admin only route to update user password
router.put(
  '/update-password',
  updateUserPasswordValidation,
  validateRequest,
  authMiddleware,
  roleCheck([ROLES.ADMIN]),
  updateUserPassword
); // update user password by admin

export default router;
