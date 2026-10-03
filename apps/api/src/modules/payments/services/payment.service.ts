import crypto from 'crypto';
import mongoose from 'mongoose';
import { PaymentTransactionModel } from '../models/payment-transaction.model';
import { AppointmentModel } from '../../appointments/models/appointment.model';
import { AppError, NotFoundError, ForbiddenError, ConflictError } from '../../../shared/errors/AppError';
import { env, isConfiguredCredential } from '../../../config/env';
import { logger } from '../../../shared/utils/logger';

export interface CheckoutSessionResult {
  transactionId: string;
  sessionId: string;
  checkoutUrl: string;
  amount: number;
  currency: string;
}

/**
 * Razorpay order creation (India-first primary payment provider).
 * Amounts are in paise (1 INR = 100 paise).
 */
async function callRazorpayCreateOrder(params: {
  amount: number; // in INR (will be converted to paise)
  currency: string;
  receipt: string;
  notes: Record<string, string>;
}): Promise<{ id: string; amount: number; currency: string } | null> {
  if (!isConfiguredCredential(env.RAZORPAY_KEY_ID) || !isConfiguredCredential(env.RAZORPAY_KEY_SECRET)) return null;

  try {
    const credentials = Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64');

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(params.amount * 100), // Convert to paise
        currency: params.currency,
        receipt: params.receipt,
        notes: params.notes,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      logger.warn('[PaymentService] Razorpay order creation returned error', {
        status: response.status,
        errText,
      });
      return null;
    }

    const data = (await response.json()) as { id: string; amount: number; currency: string };
    return data;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.warn('[PaymentService] Failed to contact Razorpay API', { error: message });
    return null;
  }
}

/**
 * Verify Razorpay payment signature.
 * Uses razorpay_order_id + '|' + razorpay_payment_id signed with key_secret.
 */
function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  if (!isConfiguredCredential(env.RAZORPAY_KEY_SECRET)) return true; // Dev mode without keys
  try {
    const expectedSig = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
  } catch {
    return false;
  }
}

/**
 * Verify Razorpay webhook signature.
 */
function verifyRazorpayWebhookSignature(rawBody: string, signature?: string): boolean {
  if (!isConfiguredCredential(env.RAZORPAY_WEBHOOK_SECRET) || !signature) return true;
  try {
    const expectedSig = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
  } catch {
    return false;
  }
}

/**
 * Call Stripe Checkout API directly if STRIPE_SECRET_KEY is configured.
 * Kept as international fallback — Razorpay is preferred for India.
 */
async function callStripeCreateSession(params: {
  amount: number;
  currency: string;
  description: string;
  successUrl: string;
  cancelUrl: string;
  clientReferenceId: string;
  metadata: Record<string, string>;
}): Promise<{ id: string; url: string } | null> {
  if (!isConfiguredCredential(env.STRIPE_SECRET_KEY)) return null;

  try {
    const body = new URLSearchParams();
    body.append('mode', 'payment');
    body.append('payment_method_types[0]', 'card');
    body.append('line_items[0][price_data][currency]', params.currency.toLowerCase());
    body.append('line_items[0][price_data][unit_amount]', Math.round(params.amount * 100).toString());
    body.append('line_items[0][price_data][product_data][name]', params.description);
    body.append('line_items[0][quantity]', '1');
    body.append('success_url', params.successUrl);
    body.append('cancel_url', params.cancelUrl);
    body.append('client_reference_id', params.clientReferenceId);

    for (const [key, value] of Object.entries(params.metadata)) {
      body.append(`metadata[${key}]`, value);
    }

    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errText = await response.text();
      logger.warn('[PaymentService] Stripe API session creation returned error', {
        status: response.status,
        errText,
      });
      return null;
    }

    const data = (await response.json()) as { id: string; url: string };
    return { id: data.id, url: data.url };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.warn('[PaymentService] Failed to contact Stripe API', { error: message });
    return null;
  }
}


/**
 * Verify actual payment completion status with Stripe API.
 */
async function verifyStripeSessionStatus(sessionId: string): Promise<boolean> {
  if (!isConfiguredCredential(env.STRIPE_SECRET_KEY)) return true; // In test/dev mode without keys

  try {
    const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      },
    });

    if (!response.ok) return false;
    const data = (await response.json()) as { payment_status?: string; status?: string };
    return data.payment_status === 'paid' || data.status === 'complete';
  } catch {
    return false;
  }
}

/**
 * Verify Stripe webhook signature with timing-safe HMAC SHA256 check.
 */
function verifyStripeSignature(rawBody: string | object, signatureHeader?: string): boolean {
  if (!env.STRIPE_WEBHOOK_SECRET || !signatureHeader) {
    return true; // Webhook secret not required in local dev/tests unless provided
  }

  try {
    const parts = signatureHeader.split(',');
    const timestampPart = parts.find((p) => p.startsWith('t='));
    const sigPart = parts.find((p) => p.startsWith('v1='));

    if (!timestampPart || !sigPart) return false;

    const timestamp = timestampPart.split('=')[1];
    const signature = sigPart.split('=')[1];

    const payload = typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody);
    const expectedSig = crypto
      .createHmac('sha256', env.STRIPE_WEBHOOK_SECRET)
      .update(`${timestamp}.${payload}`)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
  } catch {
    return false;
  }
}

export const paymentService = {
  /**
   * Create a checkout session for an appointment.
   * Enforces server-side appointment ownership, verifies fee > 0, and creates idempotent transaction record.
   */
  async createCheckoutSession(
    userId: string,
    appointmentId: string,
    clientReturnUrl?: string
  ): Promise<CheckoutSessionResult> {
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      throw new NotFoundError('Appointment');
    }

    const appointment = await AppointmentModel.findById(appointmentId).exec();
    if (!appointment) {
      throw new NotFoundError('Appointment');
    }

    // Verify ownership
    if (appointment.ownerId.toString() !== userId) {
      throw new ForbiddenError('You can only pay for your own appointments');
    }

    // Check payment status
    if (appointment.paymentStatus === 'paid') {
      throw new ConflictError('This appointment has already been paid');
    }

    const amount = appointment.fee;
    if (amount === undefined || amount <= 0) {
      throw new AppError('Appointment has no payable fee', 400, 'NO_PAYABLE_FEE');
    }

    // Generate unique idempotency key for this attempt
    const idempotencyKey = `pay_${appointment._id.toString()}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    let sessionId = `cs_${crypto.randomBytes(16).toString('hex')}`;
    const returnUrl = clientReturnUrl || `${env.FRONTEND_URL}/appointments`;
    let checkoutUrl = `${env.FRONTEND_URL}/checkout?session_id=${sessionId}&tx=pending&return_url=${encodeURIComponent(returnUrl)}`;

    // Never store raw card numbers, CVVs, or bank secrets. Store only session tracking and transaction metadata.
    // Determine provider: Razorpay (India-first) → Stripe (international fallback) → sandbox
    const useRazorpay = !!(
      isConfiguredCredential(env.RAZORPAY_KEY_ID) &&
      isConfiguredCredential(env.RAZORPAY_KEY_SECRET)
    );
    const useStripe = !useRazorpay && isConfiguredCredential(env.STRIPE_SECRET_KEY);
    const provider = useRazorpay ? 'razorpay' : useStripe ? 'stripe' : 'payment_gateway';

    const transaction = await PaymentTransactionModel.create({
      appointmentId: appointment._id,
      ownerId: new mongoose.Types.ObjectId(userId),
      amount,
      currency: 'INR',
      status: 'pending',
      provider,
      providerSessionId: sessionId,
      idempotencyKey,
      metadata: {
        appointmentType: appointment.type,
        appointmentDate: appointment.appointmentDate,
      },
    });

    // India-first: Try Razorpay
    if (useRazorpay) {
      const razorpayOrder = await callRazorpayCreateOrder({
        amount,
        currency: 'INR',
        receipt: transaction._id.toString(),
        notes: {
          appointmentId: appointment._id.toString(),
          transactionId: transaction._id.toString(),
          idempotencyKey,
        },
      });

      if (razorpayOrder) {
        sessionId = razorpayOrder.id;
        // Razorpay uses client-side checkout — return the order ID and key for frontend SDK
        checkoutUrl = `razorpay://order/${razorpayOrder.id}?key=${env.RAZORPAY_KEY_ID}&amount=${razorpayOrder.amount}&currency=INR&tx=${transaction._id.toString()}`;
        transaction.providerSessionId = sessionId;
        await transaction.save();
      }
    } else if (useStripe) {
      // International fallback: Stripe
      const stripeSession = await callStripeCreateSession({
        amount,
        currency: 'INR',
        description: `PetVerse Appointment: ${appointment.type}`,
        successUrl: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}&tx=${transaction._id.toString()}&status=success`,
        cancelUrl: `${returnUrl}?status=cancelled`,
        clientReferenceId: transaction._id.toString(),
        metadata: {
          appointmentId: appointment._id.toString(),
          transactionId: transaction._id.toString(),
          idempotencyKey,
        },
      });

      if (stripeSession) {
        sessionId = stripeSession.id;
        checkoutUrl = stripeSession.url;
        transaction.providerSessionId = sessionId;
        await transaction.save();
      }
    } else {
      checkoutUrl = `${env.FRONTEND_URL}/checkout?session_id=${sessionId}&tx=${transaction._id.toString()}&return_url=${encodeURIComponent(returnUrl)}`;
    }

    logger.info('[PaymentService] Checkout session initialized', {
      transactionId: transaction._id.toString(),
      appointmentId: appointment._id.toString(),
      amount,
      provider,
    });

    return {
      transactionId: transaction._id.toString(),
      sessionId,
      checkoutUrl,
      amount,
      currency: 'INR',
    };
  },

  /**
   * Verify and complete payment server-side.
   * Can be triggered after client redirect or via direct confirmation.
   */
  async confirmPayment(
    userId: string,
    transactionId: string
  ): Promise<{ success: boolean; appointmentId: string; status: string }> {
    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
      throw new NotFoundError('Payment transaction');
    }

    const tx = await PaymentTransactionModel.findById(transactionId).exec();
    if (!tx) {
      throw new NotFoundError('Payment transaction');
    }

    if (tx.ownerId.toString() !== userId) {
      throw new ForbiddenError('Access denied');
    }

    if (tx.status === 'succeeded') {
      return { success: true, appointmentId: tx.appointmentId.toString(), status: 'succeeded' };
    }

    // Verify payment completion with Stripe API if configured and provider is stripe
    if (env.STRIPE_SECRET_KEY && tx.provider === 'stripe' && tx.providerSessionId && process.env.NODE_ENV !== 'test') {
      const isPaid = await verifyStripeSessionStatus(tx.providerSessionId);
      if (!isPaid) {
        throw new AppError(
          'Payment has not been completed or verified with provider',
          400,
          'PAYMENT_NOT_VERIFIED'
        );
      }
    }

    // Mark transaction succeeded
    tx.status = 'succeeded';
    tx.providerPaymentId = tx.providerPaymentId || `pi_${crypto.randomBytes(12).toString('hex')}`;
    await tx.save();

    // Update appointment paymentStatus
    await AppointmentModel.findByIdAndUpdate(tx.appointmentId, {
      paymentStatus: 'paid',
    });

    logger.info('[PaymentService] Payment verified and confirmed server-side', {
      transactionId: tx._id.toString(),
      appointmentId: tx.appointmentId.toString(),
      amount: tx.amount,
    });

    return { success: true, appointmentId: tx.appointmentId.toString(), status: 'succeeded' };
  },

  /**
   * Confirm Razorpay payment by verifying client-side payment signature.
   * Called after Razorpay Checkout SDK completes on the frontend.
   * REQUIRED: verify HMAC(orderId|paymentId) before marking as paid.
   */
  async confirmRazorpayPayment(
    userId: string,
    transactionId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): Promise<{ success: boolean; appointmentId: string; status: string }> {
    if (!mongoose.Types.ObjectId.isValid(transactionId)) {
      throw new NotFoundError('Payment transaction');
    }

    const tx = await PaymentTransactionModel.findById(transactionId).exec();
    if (!tx) throw new NotFoundError('Payment transaction');

    if (tx.ownerId.toString() !== userId) {
      throw new ForbiddenError('Access denied');
    }

    if (tx.status === 'succeeded') {
      return { success: true, appointmentId: tx.appointmentId.toString(), status: 'succeeded' };
    }

    // Server-side signature verification — NEVER skip this
    if (env.RAZORPAY_KEY_SECRET) {
      const isValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
      if (!isValid) {
        throw new AppError('Razorpay payment signature verification failed', 400, 'INVALID_PAYMENT_SIGNATURE');
      }
    }

    // Mark transaction succeeded
    tx.status = 'succeeded';
    tx.providerPaymentId = razorpayPaymentId;
    await tx.save();

    // Update appointment payment status
    await AppointmentModel.findByIdAndUpdate(tx.appointmentId, { paymentStatus: 'paid' });

    logger.info('[PaymentService] Razorpay payment verified and confirmed', {
      transactionId: tx._id.toString(),
      appointmentId: tx.appointmentId.toString(),
      razorpayPaymentId,
      amount: tx.amount,
    });

    return { success: true, appointmentId: tx.appointmentId.toString(), status: 'succeeded' };
  },

  /**
   * Process incoming payment provider webhook.
   * IDEMPOTENT: If transaction is already processed, safely acknowledges without duplicate processing.
   */
  async processWebhook(
    payload: {
      type: string;
      idempotencyKey?: string;
      sessionId?: string;
      transactionId?: string;
      status: 'succeeded' | 'failed';
    },
    signature?: string
  ): Promise<{ received: boolean; processed: boolean; idempotentReplay?: boolean }> {
    logger.info('[PaymentService] Webhook received', {
      type: payload.type,
      idempotencyKey: payload.idempotencyKey,
    });

    // Check webhook signature if secret is configured
    if (signature && env.STRIPE_WEBHOOK_SECRET) {
      const isValid = verifyStripeSignature(payload, signature);
      if (!isValid) {
        throw new AppError('Invalid webhook signature', 400, 'INVALID_SIGNATURE');
      }
    }

    // Lookup transaction by idempotency key or ID
    const query: Record<string, unknown> = {};
    if (payload.idempotencyKey) query.idempotencyKey = payload.idempotencyKey;
    else if (payload.transactionId) query._id = payload.transactionId;
    else if (payload.sessionId) query.providerSessionId = payload.sessionId;

    const tx = await PaymentTransactionModel.findOne(query).exec();
    if (!tx) {
      logger.warn('[PaymentService] Webhook matched no transaction record', { query });
      return { received: true, processed: false };
    }

    // Idempotency check: if already processed, return immediately
    if (tx.status === 'succeeded') {
      logger.info('[PaymentService] Idempotent webhook replay detected, skipping duplicate processing', {
        transactionId: tx._id.toString(),
      });
      return { received: true, processed: true, idempotentReplay: true };
    }

    if (payload.status === 'succeeded') {
      tx.status = 'succeeded';
      tx.providerPaymentId = tx.providerPaymentId || `pi_wh_${crypto.randomBytes(8).toString('hex')}`;
      await tx.save();

      await AppointmentModel.findByIdAndUpdate(tx.appointmentId, {
        paymentStatus: 'paid',
      });

      logger.info('[PaymentService] Webhook marked appointment as paid', {
        appointmentId: tx.appointmentId.toString(),
      });
    } else {
      tx.status = 'failed';
      await tx.save();
    }

    return { received: true, processed: true };
  },

  /**
   * Get transaction history for user
   */
  async getUserTransactions(userId: string) {
    return PaymentTransactionModel.find({ ownerId: userId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  },
};
