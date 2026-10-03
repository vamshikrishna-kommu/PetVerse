import mongoose, { Schema, type Document, type Model } from 'mongoose';
import type { IGrowthLog } from '@petverse/shared-types';

export interface IGrowthLogDocument extends Omit<IGrowthLog, '_id' | 'petId'>, Document {
  _id: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  petId: mongoose.Types.ObjectId;
  recordedAt: Date;
  weight?: number;
  height?: number;
  length?: number;
  bodyConditionScore?: number; // 1-9 scale
  activityLevel?: 'low' | 'moderate' | 'high';
  notes?: string;
  photo?: string;
  source?: string; // 'manual' | 'vet' | 'smart_scale'
}

const GrowthLogSchema = new Schema<IGrowthLogDocument>(
  {
    petId: {
      type: Schema.Types.ObjectId,
      ref: 'Pet',
      required: true,
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recordedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    weight: {
      type: Number,
      min: [0, 'Weight cannot be negative'],
    },
    height: {
      type: Number,
      min: [0, 'Height cannot be negative'],
    },
    length: {
      type: Number,
      min: [0, 'Length cannot be negative'],
    },
    bodyConditionScore: {
      type: Number,
      min: 1,
      max: 9,
    },
    activityLevel: {
      type: String,
      enum: ['low', 'moderate', 'high'],
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    photo: {
      type: String,
    },
    source: {
      type: String,
      default: 'manual',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        ret._id = (ret._id as mongoose.Types.ObjectId).toString();
        ret.petId = (ret.petId as mongoose.Types.ObjectId).toString();
        ret.ownerId = (ret.ownerId as mongoose.Types.ObjectId).toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound index for efficient historical queries
GrowthLogSchema.index({ petId: 1, recordedAt: -1 });

export const GrowthLogModel: Model<IGrowthLogDocument> =
  mongoose.models.GrowthLog || mongoose.model<IGrowthLogDocument>('GrowthLog', GrowthLogSchema);
