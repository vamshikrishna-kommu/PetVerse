import mongoose, { Schema, type Document, type Model } from 'mongoose';
import type { ISurgery, SurgeryOutcome, RecoveryStatus } from '@petverse/shared-types';

export interface ISurgeryDocument
  extends Omit<ISurgery, '_id' | 'petId' | 'ownerId' | 'createdBy' | 'updatedBy' | 'deletedBy' | 'createdAt' | 'updatedAt' | 'linkedVisitId'>,
    Document {
  petId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  linkedVisitId?: mongoose.Types.ObjectId;
}

const SurgerySchema = new Schema<ISurgeryDocument>(
  {
    petId: { type: Schema.Types.ObjectId, ref: 'Pet', required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    procedureName: { type: String, required: true, trim: true, maxlength: 300 },
    procedureCode: { type: String, trim: true, maxlength: 50 },

    surgeonName: { type: String, trim: true, maxlength: 200 },
    clinicName: { type: String, trim: true, maxlength: 200 },

    scheduledDate: { type: String },
    performedDate: { type: String },
    durationMinutes: { type: Number, min: 0 },

    anesthesiaType: { type: String, trim: true, maxlength: 200 },
    anesthesiologist: { type: String, trim: true, maxlength: 200 },

    complications: [{ type: String, trim: true }],
    outcome: {
      type: String,
      enum: ['successful', 'complicated', 'incomplete'] satisfies SurgeryOutcome[],
    },

    recoveryStatus: {
      type: String,
      enum: ['recovering', 'recovered', 'complications'] satisfies RecoveryStatus[],
    },
    recoveryNotes: { type: String, trim: true, maxlength: 5000 },
    restrictions: [{ type: String, trim: true }],

    followUpDate: { type: String },
    linkedVisitId: { type: Schema.Types.ObjectId, ref: 'MedicalRecord' },

    // AI compatibility
    aiMetadata: { type: Schema.Types.Mixed },

    // Audit
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    version: { type: Number, default: 1 },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, select: false },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User', select: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret._id = (ret._id as mongoose.Types.ObjectId).toString();
        ret.petId = (ret.petId as mongoose.Types.ObjectId).toString();
        ret.ownerId = (ret.ownerId as mongoose.Types.ObjectId).toString();
        ret.createdBy = (ret.createdBy as mongoose.Types.ObjectId).toString();
        if (ret.updatedBy) {
          ret.updatedBy = (ret.updatedBy as mongoose.Types.ObjectId).toString();
        }
        if (ret.linkedVisitId) {
          ret.linkedVisitId = (ret.linkedVisitId as mongoose.Types.ObjectId).toString();
        }
        delete ret.__v;
        delete ret.isDeleted;
        return ret;
      },
    },
  }
);

SurgerySchema.index({ petId: 1, isDeleted: 1, performedDate: -1 });
SurgerySchema.index({ petId: 1, recoveryStatus: 1, isDeleted: 1 });

export const SurgeryModel: Model<ISurgeryDocument> =
  mongoose.models.Surgery ??
  mongoose.model<ISurgeryDocument>('Surgery', SurgerySchema);
