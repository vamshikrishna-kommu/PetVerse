import mongoose, { Schema, type Document, type Model } from 'mongoose';
import type {
  ICondition,
  IConditionProgressNote,
  HealthSeverity,
  ConditionStatus,
} from '@petverse/shared-types';

export interface IConditionDocument
  extends Omit<ICondition, '_id' | 'petId' | 'ownerId' | 'progressionNotes' | 'createdBy' | 'updatedBy' | 'deletedBy' | 'createdAt' | 'updatedAt'>,
    Document {
  petId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  progressionNotes: Array<Omit<IConditionProgressNote, 'addedBy'> & { addedBy: mongoose.Types.ObjectId }>;
}

const ProgressionNoteSchema = new Schema<Omit<IConditionProgressNote, 'addedBy'> & { addedBy: mongoose.Types.ObjectId }>(
  {
    date: { type: String, required: true },
    note: { type: String, required: true, trim: true, maxlength: 2000 },
    addedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { _id: false }
);

const ConditionSchema = new Schema<IConditionDocument>(
  {
    petId: { type: Schema.Types.ObjectId, ref: 'Pet', required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    name: { type: String, required: true, trim: true, maxlength: 200 },
    icdCode: { type: String, trim: true, maxlength: 20 },
    category: { type: String, trim: true, maxlength: 100 },
    bodySystem: { type: String, trim: true, maxlength: 100 },

    acuteOrChronic: { type: String, enum: ['acute', 'chronic'], required: true },
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe', 'critical'] satisfies HealthSeverity[],
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'resolved', 'monitoring', 'recurring'] satisfies ConditionStatus[],
      default: 'active',
    },

    onsetDate: { type: String },
    diagnosedDate: { type: String },
    resolvedDate: { type: String },
    diagnosedByVet: { type: String, trim: true, maxlength: 200 },

    progressionNotes: [ProgressionNoteSchema],
    treatments: [{ type: String, trim: true }],

    isEmergencyFlag: { type: Boolean, default: false },

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
        // Serialize progressionNotes addedBy
        if (Array.isArray(ret.progressionNotes)) {
          ret.progressionNotes = (ret.progressionNotes as Array<Record<string, unknown>>).map((n) => ({
            ...n,
            addedBy: n.addedBy instanceof mongoose.Types.ObjectId
              ? n.addedBy.toString()
              : n.addedBy,
          }));
        }
        delete ret.__v;
        delete ret.isDeleted;
        return ret;
      },
    },
  }
);

ConditionSchema.index({ petId: 1, status: 1, isDeleted: 1 });
ConditionSchema.index({ petId: 1, isEmergencyFlag: 1, isDeleted: 1 });
ConditionSchema.index({ petId: 1, severity: 1, isDeleted: 1 });

export const ConditionModel: Model<IConditionDocument> =
  mongoose.models.Condition ??
  mongoose.model<IConditionDocument>('Condition', ConditionSchema);
