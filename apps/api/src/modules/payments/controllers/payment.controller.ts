import type { Request, Response } from 'express';
import { paymentService } from '../services/payment.service';
import { apiResponse } from '../../../shared/utils/apiResponse';
import { asyncHandler } from '../../../middlewares/error.middleware';

export const paymentController = {
  createCheckoutSession: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId!;
    const { appointmentId, returnUrl } = req.body as { appointmentId: string; returnUrl?: string };
    const result = await paymentService.createCheckoutSession(userId, appointmentId, returnUrl);
    apiResponse.created(res, result);
  }),

  confirmPayment: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId!;
    const { transactionId } = req.body as { transactionId: string };
    const result = await paymentService.confirmPayment(userId, transactionId);
    apiResponse.success(res, result);
  }),

  /** Razorpay-specific: verify client-side signature after payment completion */
  confirmRazorpayPayment: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId!;
    const { transactionId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body as {
      transactionId: string;
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    };
    const result = await paymentService.confirmRazorpayPayment(
      userId,
      transactionId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    );
    apiResponse.success(res, result);
  }),

  handleWebhook: asyncHandler(async (req: Request, res: Response) => {
    // Accept both Razorpay and Stripe webhook signature headers
    const razorpaySignature = req.headers['x-razorpay-signature'] as string | undefined;
    const stripeSignature = req.headers['stripe-signature'] as string | undefined;
    const signature = razorpaySignature || stripeSignature;
    const result = await paymentService.processWebhook(req.body, signature);
    apiResponse.success(res, result);
  }),

  getHistory: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId!;
    const history = await paymentService.getUserTransactions(userId);
    apiResponse.success(res, history);
  }),
};
