import mongoose, { Schema, Model } from 'mongoose';
import { IEventDocument, DomainEventType, EventStatus } from '@petverse/shared-types';

const EventSchema = new Schema<IEventDocument>(
  {
    aggregateId: {
      type: String,
      required: true,
      index: true,
    },
    aggregateType: {
      type: String,
      required: true,
    },
    eventType: {
      type: String,
      enum: Object.values(DomainEventType),
      required: true,
      index: true,
    },
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    metadata: {
      version: {
        type: Number,
        required: true,
        default: 1,
      },
      timestamp: {
        type: String,
        required: true,
      },
      correlationId: {
        type: String,
        index: true,
      },
      causationId: {
        type: String,
      },
      replayFlag: {
        type: Boolean,
        default: false,
      },
      source: {
        type: String,
      },
      userId: {
        type: String,
      },
    },
    status: {
      type: String,
      enum: Object.values(EventStatus),
      default: EventStatus.Pending,
      index: true,
    },
    processingError: {
      type: String,
    },
    createdBy: {
      type: String,
      required: true,
    },
    updatedBy: {
      type: String,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// Compound index for querying events by aggregate chronologically
EventSchema.index({ aggregateId: 1, 'metadata.timestamp': 1 });

export const EventModel: Model<IEventDocument> = mongoose.models.Event || mongoose.model<IEventDocument>('Event', EventSchema);
