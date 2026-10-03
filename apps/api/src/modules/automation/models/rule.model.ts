import mongoose, { Schema, Model } from 'mongoose';
import { IAutomationRule, DomainEventType, AutomationPriority } from '@petverse/shared-types';

const AutomationActionSchema = new Schema(
  {
    type: { type: String, required: true },
    config: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const AutomationRuleSchema = new Schema<IAutomationRule>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    triggerEvent: {
      type: String,
      enum: Object.values(DomainEventType),
      required: true,
      index: true,
    },
    conditions: {
      type: Schema.Types.Mixed, // JSONLogic tree
    },
    actions: {
      type: [AutomationActionSchema],
      required: true,
    },
    priority: {
      type: Number,
      default: AutomationPriority.Normal,
      index: true,
    },
    isEnabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    maxRetries: {
      type: Number,
      default: 3,
    },
    createdBy: { type: String, required: true },
    updatedBy: { type: String },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export const AutomationRuleModel: Model<IAutomationRule> = mongoose.models.AutomationRule || mongoose.model<IAutomationRule>('AutomationRule', AutomationRuleSchema);
