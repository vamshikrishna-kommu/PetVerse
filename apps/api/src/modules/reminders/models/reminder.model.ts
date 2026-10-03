import mongoose, { Schema, Model } from 'mongoose';
import { IReminder, ReminderType, ReminderFrequency, PriorityLevel } from '@petverse/shared-types';

/** Local extension of IReminder to support the idempotencyKey field. */
export interface IReminderDocument extends IReminder {
  /**
   * Deterministic idempotency key derived from the source domain event.
   * Format: `${eventId}::${type}::${petId}`
   * Protected by a unique sparse MongoDB index.
   */
  idempotencyKey?: string;
}

const EscalationSchema = new Schema(
  {
    maxRetries: { type: Number, default: 0 },
    retryIntervalMinutes: { type: Number, default: 60 },
    notifySecondaryOwner: { type: Boolean, default: false },
    emergencyEscalation: { type: Boolean, default: false },
  },
  { _id: false }
);

const ReminderSchema = new Schema<IReminderDocument>(
  {
    ownerId: { type: String, required: true, index: true },
    petId: { type: String, required: true, index: true },
    type: { type: String, enum: ['medication', 'vaccination', 'appointment', 'grooming', 'checkup', 'other'], required: true, index: true },
    title: { type: String, required: true },
    message: { type: String },
    
    // Schedule
    frequency: { type: String, enum: ['once', 'daily', 'weekly', 'monthly', 'custom'], required: true },
    cronExpression: { type: String },
    timezone: { type: String, required: true, default: 'UTC' },
    nextTrigger: { type: String, required: true, index: true }, // Index for fast polling
    validUntil: { type: String },
    
    // State
    isActive: { type: Boolean, default: true, index: true },
    snoozedUntil: { type: String },
    missedCount: { type: Number, default: 0 },
    completedCount: { type: Number, default: 0 },
    
    // Escalation & Config
    escalation: { type: EscalationSchema, default: () => ({}) },
    notificationChannels: { 
      type: [String], 
      enum: ['push', 'email', 'sms', 'in-app', 'silent'], 
      default: ['in-app', 'push'] 
    },
    priority: { 
      type: String, 
      enum: ['low', 'medium', 'high', 'critical', 'emergency'],
      default: 'medium' 
    },
    
    linkedEntityId: { type: String },

    /**
     * Idempotency key — deterministic string derived from the source event.
     * Ensures that re-processing the same domain event never creates duplicate reminders.
     * Format: `${sourceEventId}::${type}::${petId}`
     */
    idempotencyKey: { type: String },
  },
  { timestamps: true }
);

// Compound index for finding due reminders quickly
ReminderSchema.index({ isActive: 1, nextTrigger: 1 });

// Unique sparse index for idempotency — prevents duplicate reminders from the same event
ReminderSchema.index({ idempotencyKey: 1 }, { unique: true, sparse: true });

export const ReminderModel: Model<IReminderDocument> = mongoose.models.Reminder || mongoose.model<IReminderDocument>('Reminder', ReminderSchema);

