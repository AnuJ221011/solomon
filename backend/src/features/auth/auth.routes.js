import { Router } from 'express';
import multer from 'multer';
import * as ctrl from './auth.controller.js';
import { validate } from '../../shared/middleware/validate.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { authorize } from '../../shared/middleware/authorize.js';
import { authLimiter, otpLimiter } from '../../shared/middleware/rateLimiter.js';
import { createError } from '../../shared/utils/createError.js';
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

// Multer instance for brand document uploads (PDF + image, 5 MB per file)
const docUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only JPG, PNG, or PDF files are allowed'));
    }
    cb(null, true);
  },
});

const DOC_FIELDS = [
  { name: 'brandLogo', maxCount: 1 },
  { name: 'brandBanner', maxCount: 1 },
  { name: 'aadhar', maxCount: 1 },
  { name: 'pan', maxCount: 1 },
  { name: 'gstCert', maxCount: 1 },
  { name: 'incorporateCert', maxCount: 1 },
  { name: 'msmeCert', maxCount: 1 },
  { name: 'isoCert', maxCount: 1 },
  { name: 'iecCert', maxCount: 1 },
];

// Wraps multer so upload errors go to Express error handler
const safeDocUpload = (multerFn) => (req, res, next) =>
  multerFn(req, res, (err) => {
    if (err) return next(createError(`Upload error: ${err.message}`, 400));
    next();
  });

// Parses the stringified JSON `data` field that the client sends alongside files
const parseFormDataBody = (req, _res, next) => {
  if (req.body?.data) {
    try {
      req.body = JSON.parse(req.body.data);
    } catch {
      return next(createError('Invalid form data payload', 400));
    }
  }
  next();
};

// Email / password flows
router.post('/buyer/signup', authLimiter, validate(buyerSignupSchema), ctrl.buyerSignup);
router.post(
  '/brand/signup',
  authLimiter,
  safeDocUpload(docUpload.fields(DOC_FIELDS)),
  parseFormDataBody,
  validate(brandSignupSchema),
  ctrl.brandSignup,
);
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
