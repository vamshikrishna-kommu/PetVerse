import { Router } from 'express';
import { z } from 'zod';
import { authController } from './auth.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';

const router: Router = Router();

// Validation schemas
const registerSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
  phone: z.string().regex(/^\+?[1-9]\d{6,14}$/).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const googleAuthSchema = z.object({
  idToken: z.string().min(1),
});

const otpSchema = z.object({
  target: z.string().min(1),
  type: z.enum(['email', 'phone']),
  otp: z.string().length(6).regex(/^\d+$/).optional(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string().min(32),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
});

// Routes
router.post('/register',        validate(registerSchema),                       authController.register);
router.post('/login',           validate(loginSchema),                          authController.login);
router.post('/logout',          authenticate,                                   authController.logout);
router.post('/logout-all',      authenticate,                                   authController.logout);
router.post('/refresh',                                                         authController.refresh);
router.post('/google',          validate(googleAuthSchema),                     authController.googleAuth);
router.post('/send-otp',        validate(otpSchema.omit({ otp: true })),        authController.sendOtp);
router.post('/verify-otp',      validate(otpSchema.required({ otp: true })),    authController.verifyOtp);
router.post('/forgot-password', validate(forgotPasswordSchema),                 authController.forgotPassword);
router.post('/reset-password',  validate(resetPasswordSchema),                  authController.resetPassword);

export default router;

