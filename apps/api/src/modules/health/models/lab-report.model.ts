import mongoose, { Schema, type Document, type Model } from 'mongoose';
import type {
  ILabReport,
  ILabResult,
  LabCategory,
  LabReportStatus,
  LabResultStatus,
} from '@petverse/shared-types';

export interface ILabReportDocument
  extends Omit<ILabReport, '_id' | 'petId' | 'ownerId' | 'createdBy' | 'updatedBy' | 'deletedBy' | 'createdAt' | 'updatedAt' | 'linkedVisitId'>,
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

const LabResultSchema = new Schema<ILabResult>(
  {
    testName: { type: String, required: true, trim: true, maxlength: 200 },
    value: { type: Schema.Types.Mixed, required: true },
    unit: { type: String, trim: true, maxlength: 50 },
    referenceRange: {
      min: { type: Number },
      max: { type: Number },
      text: { type: String, trim: true, maxlength: 200 },
    },
    status: {
      type: String,
      enum: ['normal', 'high', 'low', 'critical_high', 'critical_low'] satisfies LabResultStatus[],
      default: 'normal',
    },
    isAbnormal: { type: Boolean, default: false },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false }
);

const LabReportSchema = new Schema<ILabReportDocument>(
  {
    petId: { type: Schema.Types.ObjectId, ref: 'Pet', required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    category: {
      type: String,
      required: true,
      enum: ['blood', 'urine', 'biochemistry', 'hormones', 'microbiology', 'parasitology', 'other'] satisfies LabCategory[],
    },
    reportTitle: { type: String, required: true, trim: true, maxlength: 300 },
    orderedBy: { type: String, trim: true, maxlength: 200 },
    performedAt: { type: String, trim: true, maxlength: 300 },
    collectedDate: { type: String },
    resultDate: { type: String },

    status: {
      type: String,
      enum: ['ordered', 'collected', 'processing', 'resulted', 'reviewed'] satisfies LabReportStatus[],
      default: 'ordered',
    },
    results: [LabResultSchema],
    vetInterpretation: { type: String, trim: true, maxlength: 5000 },
    // Denormalized count for quick dashboard queries
    abnormalCount: { type: Number, default: 0, min: 0 },

    attachments: [{ type: String }],
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

LabReportSchema.index({ petId: 1, isDeleted: 1, resultDate: -1 });
LabReportSchema.index({ petId: 1, category: 1, isDeleted: 1 });
LabReportSchema.index({ petId: 1, status: 1, isDeleted: 1 });

export const LabReportModel: Model<ILabReportDocument> =
  mongoose.models.LabReport ??
  mongoose.model<ILabReportDocument>('LabReport', LabReportSchema);
