import { Router } from 'express';
import { paymentController } from './controllers/payment.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { z } from 'zod';
import { mongoId } from '../../shared/validation/schemas';

const router = Router();

const createSessionSchema = z.object({
  appointmentId: mongoId,
  returnUrl: z.string().url().optional(),
});

const confirmPaymentSchema = z.object({
  transactionId: mongoId,
});

const confirmRazorpaySchema = z.object({
  transactionId: mongoId,
  razorpayOrderId: z.string().min(1, 'Razorpay order ID is required'),
  razorpayPaymentId: z.string().min(1, 'Razorpay payment ID is required'),
  razorpaySignature: z.string().min(1, 'Razorpay signature is required'),
});

// Webhook endpoint (unauthenticated, signature-verified, idempotent)
// Accepts both Razorpay (x-razorpay-signature) and Stripe (stripe-signature)
router.post('/webhook', paymentController.handleWebhook);

// Protected payment endpoints
router.use(authenticate);

router.post('/checkout-session', validate(createSessionSchema), paymentController.createCheckoutSession);
router.post('/confirm', validate(confirmPaymentSchema), paymentController.confirmPayment);
/** Razorpay client-side payment confirmation — verifies HMAC signature server-side */
router.post('/confirm-razorpay', validate(confirmRazorpaySchema), paymentController.confirmRazorpayPayment);
router.get('/history', paymentController.getHistory);

export const paymentRoutes: Router = router;
