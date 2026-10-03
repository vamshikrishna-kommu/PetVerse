/**
 * PetVerse Notification Providers
 *
 * Three concrete providers:
 *   InAppProvider   – persists to MongoDB; frontend polls or WebSocket pushes.
 *   EmailProvider   – sends via SendGrid SMTP when SENDGRID_API_KEY is set,
 *                     logs to console in dev with a clear warning otherwise.
 *   PushProvider    – sends via Firebase Admin when credentials are configured,
 *                     logs a clear warning in dev/unconfigured mode.
 *
 * SECURITY: API keys, credentials, and private keys are NEVER logged.
 */

import nodemailer from 'nodemailer';
import { env } from '../../../config/env';
import { logger } from '../../../shared/utils/logger';

// ─── Email Provider ────────────────────────────────────────────────────────

/** Build a nodemailer transporter from environment. */
function buildEmailTransporter(): nodemailer.Transporter | null {
  if (env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: {
        user: 'apikey',
        pass: env.SENDGRID_API_KEY,
      },
    });
  }
  return null;
}

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

export interface EmailResult {
  success: boolean;
  provider: 'sendgrid' | 'dev-log';
  error?: string;
}

export async function sendEmailNotification(payload: EmailPayload): Promise<EmailResult> {
  const transporter = buildEmailTransporter();

  if (!transporter) {
    if (env.NODE_ENV === 'production') {
      // Production without credentials: log error, mark as failed — never silently claim success.
      logger.error('[EmailProvider] SENDGRID_API_KEY is not configured in production. Email NOT sent.', {
        to: payload.to,
        subject: payload.subject,
      });
      return { success: false, provider: 'dev-log', error: 'Email provider not configured' };
    }
    // Development: log clearly so developers can see what would be sent.
    logger.info('[EmailProvider:dev] Email would be sent in production', {
      to: payload.to,
      subject: payload.subject,
      htmlPreview: payload.html.slice(0, 200),
    });
    return { success: true, provider: 'dev-log' };
  }

  try {
    await transporter.sendMail({
      from: `PetVerse <${env.EMAIL_FROM}>`,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    });
    logger.info('[EmailProvider] Email sent via SendGrid', { to: payload.to, subject: payload.subject });
    return { success: true, provider: 'sendgrid' };
  } catch (err: any) {
    // Never log the full error object (may contain auth details from transporter)
    logger.error('[EmailProvider] SendGrid delivery failed', {
      to: payload.to,
      subject: payload.subject,
      errorMessage: err?.message ?? 'Unknown error',
    });
    return { success: false, provider: 'sendgrid', error: err?.message ?? 'Delivery failed' };
  }
}

// ─── Push Provider ─────────────────────────────────────────────────────────

export interface PushPayload {
  fcmToken: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface PushResult {
  success: boolean;
  provider: 'firebase' | 'dev-log';
  messageId?: string;
  error?: string;
}

/** Lazily initialise Firebase Admin. Returns null if credentials are absent. */
async function getFirebaseMessaging(): Promise<import('firebase-admin/messaging').Messaging | null> {
  if (!env.FIREBASE_PROJECT_ID || !env.FIREBASE_PRIVATE_KEY || !env.FIREBASE_CLIENT_EMAIL) {
    return null;
  }
  try {
    const admin = await import('firebase-admin');
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: env.FIREBASE_PROJECT_ID,
          privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
        }),
      });
    }
    return admin.messaging();
  } catch (err: any) {
    logger.error('[PushProvider] Failed to initialise Firebase Admin', {
      errorMessage: err?.message ?? 'Unknown error',
    });
    return null;
  }
}

export async function sendPushNotification(payload: PushPayload): Promise<PushResult> {
  const messaging = await getFirebaseMessaging();

  if (!messaging) {
    if (env.NODE_ENV === 'production') {
      logger.error(
        '[PushProvider] Firebase credentials are not configured in production. Push notification NOT sent.',
        { title: payload.title }
      );
      return { success: false, provider: 'dev-log', error: 'Push provider not configured' };
    }
    logger.info('[PushProvider:dev] Push notification would be sent in production', {
      title: payload.title,
      body: payload.body,
    });
    return { success: true, provider: 'dev-log' };
  }

  try {
    const messageId = await messaging.send({
      token: payload.fcmToken,
      notification: { title: payload.title, body: payload.body },
      data: payload.data,
      android: { priority: 'high' },
      apns: { payload: { aps: { contentAvailable: true, sound: 'default' } } },
    });
    logger.info('[PushProvider] Firebase FCM push sent', { title: payload.title, messageId });
    return { success: true, provider: 'firebase', messageId };
  } catch (err: any) {
    logger.error('[PushProvider] Firebase FCM delivery failed', {
      title: payload.title,
      errorMessage: err?.message ?? 'Unknown error',
    });
    return { success: false, provider: 'firebase', error: err?.message ?? 'Delivery failed' };
  }
}
