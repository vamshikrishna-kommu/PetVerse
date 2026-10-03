import mongoose, { Schema, Model } from 'mongoose';
import { INotification, PriorityLevel, DeliveryStatus, NotificationChannel } from '@petverse/shared-types';

const NotificationDeliverySchema = new Schema(
  {
    channel: {
      type: String,
      enum: ['push', 'email', 'sms', 'in-app', 'silent'],
      required: true,
    },
    status: {
      type: String,
      enum: ['queued', 'sent', 'delivered', 'read', 'clicked', 'dismissed', 'failed', 'retrying', 'dead_letter'],
      required: true,
      default: 'queued',
    },
    sentAt: { type: String },
    deliveredAt: { type: String },
    readAt: { type: String },
    error: { type: String },
    retryCount: { type: Number, default: 0 },
    deadLetterReason: { type: String },
    nextRetryAt: { type: String },
  },
  { _id: false }
);

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, required: true, index: true }, // NotificationType
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical', 'emergency'],
      required: true,
      default: 'low',
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    deliveries: { type: [NotificationDeliverySchema], default: [] },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: String },
    isDeadLetter: { type: Boolean, default: false, index: true },
    expiresAt: { type: String, index: { expireAfterSeconds: 0 } }, // TTL index
  },
  { timestamps: true }
);

// Compound index for querying user's unread feed efficiently
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

export const NotificationModel: Model<INotification> = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
