import express from 'express';
const router = express.Router();
import {
  register,
  login,
  googleSignIn,
  sendPasswordResetOTP,
  verifyPasswordResetOTP,
  resetPassword,
  resendPasswordResetOTP,
  logout,
} from '../controllers/authController.js';
import { verifyFirebaseToken, verifyJWT, authenticate } from '../middleware/auth.js';
import {
  validateUserRegistration,
  validateUserLogin,
  validatePasswordResetRequest,
  validateOTPVerification,
  validatePasswordReset,
} from '../middleware/validation.js';




// Authentication routes
router.post('/register', validateUserRegistration, register);
router.post('/login', validateUserLogin, login);
router.post('/google-signin', googleSignIn);
router.post('/logout', authenticate, logout);

// Password reset routes
router.post('/forgot-password', validatePasswordResetRequest, sendPasswordResetOTP);
router.post('/resend-otp', validatePasswordResetRequest, resendPasswordResetOTP);
router.post('/verify-otp', validateOTPVerification, verifyPasswordResetOTP);
router.post('/reset-password', validatePasswordReset, resetPassword);

export default router;
