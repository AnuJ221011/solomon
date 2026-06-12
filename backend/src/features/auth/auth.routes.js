import { Router } from 'express';
import * as ctrl from './auth.controller.js';
import { validate } from '../../shared/middleware/validate.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { authLimiter, otpLimiter } from '../../shared/middleware/rateLimiter.js';
import {
  buyerSignupSchema,
  brandSignupSchema,
  loginSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  storeTypeQuizSchema,
  changePendingEmailSchema,
} from './auth.validator.js';

const router = Router();

// Email / password flows
router.post('/buyer/signup', authLimiter, validate(buyerSignupSchema), ctrl.buyerSignup);
router.post('/brand/signup', authLimiter, validate(brandSignupSchema), ctrl.brandSignup);
router.post('/login', authLimiter, validate(loginSchema), ctrl.login);
router.post('/logout', ctrl.logout);
router.post('/refresh', ctrl.refreshToken);

// Email verification
router.post('/verify-email', otpLimiter, validate(verifyOtpSchema), ctrl.verifyEmail);
router.post('/resend-otp', otpLimiter, ctrl.resendOtp);
router.post('/change-pending-email', otpLimiter, validate(changePendingEmailSchema), ctrl.changePendingEmail);

// Password reset
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), ctrl.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), ctrl.resetPassword);

// Store type quiz (buyers — can be completed post-signup)
router.post('/store-quiz', authenticate, authorize('BUYER'), validate(storeTypeQuizSchema), ctrl.saveStoreTypeQuiz);

// Authenticated
router.get('/me', authenticate, ctrl.getMe);

// Google OAuth — deferred to Phase 2
// router.get('/google', ...)
// router.get('/google/callback', ...)

export default router;
