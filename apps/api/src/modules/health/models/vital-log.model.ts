import mongoose, { Schema, type Document, type Model } from 'mongoose';
import type { IVitalLog, HydrationStatus } from '@petverse/shared-types';

export interface IVitalLogDocument
  extends Omit<IVitalLog, '_id' | 'petId' | 'ownerId' | 'createdBy' | 'deletedAt' | 'createdAt' | 'updatedAt' | 'linkedVisitId'>,
    Document {
  petId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  linkedVisitId?: mongoose.Types.ObjectId;
}

const BloodPressureSchema = new Schema(
  { systolic: { type: Number }, diastolic: { type: Number } },
  { _id: false }
);

const VitalLogSchema = new Schema<IVitalLogDocument>(
  {
    petId: { type: Schema.Types.ObjectId, ref: 'Pet', required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    recordedAt: { type: String, required: true },
    recordedBy: { type: String, enum: ['owner', 'vet'], default: 'owner' },

    // Core vitals — all optional; log at least one
    weight: { type: Number, min: 0, max: 999 },             // kg
    height: { type: Number, min: 0, max: 999 },             // cm
    temperature: { type: Number, min: 25, max: 45 },        // °C
    pulse: { type: Number, min: 0, max: 999 },              // bpm
    respiratoryRate: { type: Number, min: 0, max: 200 },    // breaths/min
    bloodPressure: { type: BloodPressureSchema },
    oxygenSaturation: { type: Number, min: 0, max: 100 },   // %
    bodyConditionScore: { type: Number, min: 1, max: 9 },   // Purina 1-9 scale
    painScore: { type: Number, min: 0, max: 10 },           // NRS 0-10
    hydration: {
      type: String,
      enum: ['normal', 'mild_dehydration', 'moderate_dehydration', 'severe_dehydration'] satisfies HydrationStatus[],
    },

    notes: { type: String, trim: true, maxlength: 1000 },
    linkedVisitId: { type: Schema.Types.ObjectId, ref: 'MedicalRecord' },

    // AI compatibility
    aiMetadata: { type: Schema.Types.Mixed },

    // Audit (vital logs are immutable — no soft delete, no versioning needed)
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret._id = (ret._id as mongoose.Types.ObjectId).toString();
        ret.petId = (ret.petId as mongoose.Types.ObjectId).toString();
        ret.ownerId = (ret.ownerId as mongoose.Types.ObjectId).toString();
        ret.createdBy = (ret.createdBy as mongoose.Types.ObjectId).toString();
        if (ret.linkedVisitId) {
          ret.linkedVisitId = (ret.linkedVisitId as mongoose.Types.ObjectId).toString();
        }
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Optimized for time-series fetching: get all vitals for a pet ordered by date
VitalLogSchema.index({ petId: 1, recordedAt: -1 });
// For trend charts: weight over time, temperature over time
VitalLogSchema.index({ petId: 1, weight: 1, recordedAt: 1 });

export const VitalLogModel: Model<IVitalLogDocument> =
  mongoose.models.VitalLog ??
  mongoose.model<IVitalLogDocument>('VitalLog', VitalLogSchema);
