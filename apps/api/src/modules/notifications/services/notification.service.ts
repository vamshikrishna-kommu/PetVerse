import mongoose from 'mongoose';
import { notificationRepository } from '../repositories/notification.repository';
import { INotification, NotificationChannel, PriorityLevel } from '@petverse/shared-types';
import { logger } from '../../../shared/utils/logger';
import {
  sendEmailNotification,
  sendPushNotification,
} from '../providers/notification.providers';
import { sendSmsNotification } from '../providers/sms.provider';
import { userRepository } from '../../users/user.repository';
import { sseService } from '../sse.service';

export class NotificationService {
  /**
   * Main entrypoint: creates a notification record and dispatches to all
   * requested delivery channels. Channel delivery is non-blocking — failures
   * are recorded on the delivery sub-document, never thrown to callers.
   */
  public async dispatch(
    userId: string,
    title: string,
    body: string,
    type: string,
    priority: PriorityLevel = 'low',
    channels: NotificationChannel[] = ['in-app'],
    data?: Record<string, unknown>
  ): Promise<INotification> {
    // 1. Prepare delivery records (one per channel, initially 'queued')
    const deliveries = channels.map((channel) => ({
      channel,
      status: 'queued' as const,
      retryCount: 0,
    }));

    // 2. Persist notification — in-app delivery is inherently satisfied by this DB record
    const notification = await notificationRepository.create({
      userId,
      title,
      body,
      type: type as any,
      priority,
      data,
      deliveries,
      isRead: false,
    });

    const notificationId = notification._id.toString();

    // 3. Process all deliveries asynchronously so the API response is never blocked.
    //    Guard: only fire if MongoDB is still connected (e.g., guards test teardown races).
    if (mongoose.connection.readyState === 1) {
      setImmediate(() => this.processDeliveries(notificationId, userId, title, body, channels, data));
    }

    return notification;
  }

  private async processDeliveries(
    notificationId: string,
    userId: string,
    title: string,
    body: string,
    channels: NotificationChannel[],
    data?: Record<string, unknown>
  ): Promise<void> {
    if (mongoose.connection.readyState !== 1) return;
    for (const channel of channels) {
      if (mongoose.connection.readyState !== 1) return;
      try {
        await this.deliverToChannel(notificationId, userId, title, body, channel, data, 0);
      } catch (err: any) {
        if (mongoose.connection.readyState !== 1) return;
        // Catch-all: channel delivery must never crash the process
        logger.error(`[NotificationService] Unhandled error delivering to channel "${channel}"`, {
          notificationId,
          channel,
          error: err?.message,
        });
        await this.handleDeliveryFailure(notificationId, userId, title, body, channel, data, err?.message, 0);
      }
    }
  }

  public async deliverToChannel(
    notificationId: string,
    userId: string,
    title: string,
    body: string,
    channel: NotificationChannel,
    data?: Record<string, unknown>,
    retryAttempt = 0
  ): Promise<void> {
    switch (channel) {
      case 'in-app': {
        // Notification is already persisted; mark delivered immediately
        if (mongoose.connection.readyState === 1) {
          await notificationRepository.updateDeliveryStatus(notificationId, 'in-app', 'delivered');
        }
        // Real-time instant delivery via authenticated Server-Sent Events (SSE) stream
        sseService.sendToUser(userId, 'notification', {
          notificationId,
          title,
          body,
          data,
          timestamp: new Date().toISOString(),
        });
        break;
      }

      case 'push': {
        // Fetch the user's FCM device token
        const user = await userRepository.findById(userId, '+fcmToken');
        const fcmToken = (user as any)?.fcmToken as string | undefined;

        if (!fcmToken) {
          logger.info('[NotificationService] No FCM token for user; skipping push', { userId });
          await notificationRepository.updateDeliveryStatus(notificationId, 'push', 'failed', 'Missing FCM token');
          break;
        }

        const result = await sendPushNotification({
          fcmToken,
          title,
          body,
          data: data
            ? Object.fromEntries(
                Object.entries(data).map(([k, v]) => [k, String(v)])
              )
            : undefined,
        });

        if (result.success) {
          await notificationRepository.updateDeliveryStatus(notificationId, 'push', 'sent');
        } else {
          await this.handleDeliveryFailure(notificationId, userId, title, body, 'push', data, result.error, retryAttempt);
        }
        break;
      }

      case 'email': {
        // Fetch the user's email address
        const user = await userRepository.findById(userId);
        const email = user?.email;

        if (!email) {
          logger.warn('[NotificationService] No email address for user; skipping email', { userId });
          await notificationRepository.updateDeliveryStatus(notificationId, 'email', 'failed', 'Missing email address');
          break;
        }

        const result = await sendEmailNotification({
          to: email,
          subject: title,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;">
              <h2 style="color:#6366f1;margin-bottom:8px;">PetVerse</h2>
              <h3 style="color:#111;">${title}</h3>
              <p style="color:#374151;">${body}</p>
            </div>
          `,
        });

        if (result.success) {
          await notificationRepository.updateDeliveryStatus(notificationId, 'email', 'sent');
        } else {
          await this.handleDeliveryFailure(notificationId, userId, title, body, 'email', data, result.error, retryAttempt);
        }
        break;
      }

      case 'sms': {
        const user = await userRepository.findById(userId);
        const phone = (user as any)?.phone;

        if (!phone) {
          logger.info('[NotificationService] No phone number on user profile; skipping SMS', { userId });
          await notificationRepository.updateDeliveryStatus(notificationId, 'sms', 'failed', 'Missing user phone number');
          break;
        }

        const smsBody = `${title}: ${body}`.slice(0, 160);
        const result = await sendSmsNotification({
          to: phone,
          body: smsBody,
        });

        if (result.success) {
          await notificationRepository.updateDeliveryStatus(notificationId, 'sms', 'sent');
        } else {
          await this.handleDeliveryFailure(notificationId, userId, title, body, 'sms', data, result.error, retryAttempt);
        }
        break;
      }

      case 'silent': {
        await notificationRepository.updateDeliveryStatus(notificationId, 'silent', 'delivered');
        break;
      }

      default:
        logger.warn(`[NotificationService] Unknown delivery channel "${channel}"`, { notificationId });
    }
  }

  /**
   * Handle delivery failure with retry backoff and Dead-Letter Queue (DLQ) transitions
   */
  private async handleDeliveryFailure(
    notificationId: string,
    userId: string,
    title: string,
    body: string,
    channel: NotificationChannel,
    data?: Record<string, unknown>,
    errorMsg = 'Delivery failed',
    currentRetryCount = 0
  ): Promise<void> {
    const nextRetry = currentRetryCount + 1;
    const maxRetries = 3;

    if (nextRetry >= maxRetries) {
      // Retries exhausted -> Transition to Dead-Letter Queue
      logger.warn(`[NotificationService:DLQ] Channel "${channel}" retries exhausted (${nextRetry}/${maxRetries}). Moving to Dead Letter Queue.`, {
        notificationId,
        channel,
        error: errorMsg,
      });

      if (mongoose.connection.readyState === 1) {
        await notificationRepository.updateDeliveryStatus(
          notificationId,
          channel,
          'dead_letter',
          errorMsg,
          {
            retryCount: nextRetry,
            deadLetterReason: `Max retries (${maxRetries}) exceeded: ${errorMsg}`,
          }
        );
      }
      return;
    }

    // Schedule retry with exponential backoff (e.g. 1s, 2s)
    const backoffMs = Math.pow(2, currentRetryCount) * 1000;
    const nextRetryAt = new Date(Date.now() + backoffMs).toISOString();

    logger.info(`[NotificationService] Retrying delivery to "${channel}" (attempt ${nextRetry}/${maxRetries}) in ${backoffMs}ms`, {
      notificationId,
    });

    if (mongoose.connection.readyState === 1) {
      await notificationRepository.updateDeliveryStatus(
        notificationId,
        channel,
        'retrying',
        errorMsg,
        {
          retryCount: nextRetry,
          nextRetryAt,
        }
      );
    }

    // Defer next attempt
    setTimeout(async () => {
      try {
        if (mongoose.connection.readyState === 1) {
          await this.deliverToChannel(notificationId, userId, title, body, channel, data, nextRetry);
        }
      } catch (err: any) {
        logger.error('[NotificationService] Retry invocation exception', { notificationId, channel, error: err?.message });
      }
    }, backoffMs);
  }

  /**
   * Admin reprocessing of dead-letter delivery
   */
  public async reprocessDeadLetter(notificationId: string, channel: NotificationChannel): Promise<INotification | null> {
    const notif = await notificationRepository.findById(notificationId);
    if (!notif) return null;

    logger.info(`[NotificationService:DLQ] Reprocessing dead letter for notification ${notificationId} on ${channel}`);
    await this.deliverToChannel(notificationId, notif.userId, notif.title, notif.body, channel, notif.data, 0);
    return notificationRepository.findById(notificationId);
  }

  public async getDeadLetterQueue(limit = 50, skip = 0): Promise<{ data: INotification[]; total: number }> {
    const data = await notificationRepository.findDeadLetters(limit, skip);
    const total = await notificationRepository.countDeadLetters();
    return { data, total };
  }
}

export const notificationService = new NotificationService();

