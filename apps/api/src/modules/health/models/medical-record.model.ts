import mongoose, { Schema, type Document, type Model } from 'mongoose';
import type {
  IMedicalRecord,
  ISOAPNote,
  VisitType,
  VisitStatus,
} from '@petverse/shared-types';

export interface IMedicalRecordDocument
  extends Omit<IMedicalRecord, '_id' | 'petId' | 'ownerId' | 'createdBy' | 'updatedBy' | 'deletedBy' | 'createdAt' | 'updatedAt'>,
    Document {
  petId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SOAPNoteSchema = new Schema<ISOAPNote>(
  {
    subjective: { type: String, trim: true, maxlength: 5000 },
    objective: { type: String, trim: true, maxlength: 5000 },
    assessment: { type: String, trim: true, maxlength: 5000 },
    plan: { type: String, trim: true, maxlength: 5000 },
  },
  { _id: false }
);

const MedicalRecordSchema = new Schema<IMedicalRecordDocument>(
  {
    petId: { type: Schema.Types.ObjectId, ref: 'Pet', required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // Visit information
    visitType: {
      type: String,
      required: true,
      enum: [
        'routine_checkup', 'sick_visit', 'follow_up', 'emergency',
        'vaccination', 'surgery', 'dental', 'dermatology',
        'specialist', 'telemedicine', 'other',
      ] satisfies VisitType[],
    },
    visitDate: { type: String, required: true },
    visitReason: { type: String, required: true, trim: true, maxlength: 500 },
    chiefComplaint: { type: String, trim: true, maxlength: 1000 },
    symptoms: [{ type: String, trim: true }],

    // Clinical SOAP Notes
    soap: { type: SOAPNoteSchema, default: () => ({}) },
    physicalExam: { type: String, trim: true, maxlength: 5000 },
    doctorNotes: { type: String, trim: true, maxlength: 5000 },

    // Clinic & Vet
    vetName: { type: String, trim: true, maxlength: 200 },
    vetLicenseNumber: { type: String, trim: true, maxlength: 100 },
    clinicName: { type: String, trim: true, maxlength: 200 },
    clinicAddress: { type: String, trim: true, maxlength: 500 },

    // Status
    status: {
      type: String,
      enum: ['draft', 'active', 'archived'] satisfies VisitStatus[],
      default: 'active',
    },

    // Follow-up
    followUpDate: { type: String },
    followUpNotes: { type: String, trim: true, maxlength: 1000 },

    // Attachment references (Cloudinary publicIds or attachment document IDs)
    attachments: [{ type: String }],

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
        delete ret.__v;
        delete ret.isDeleted;
        return ret;
      },
    },
  }
);

// Compound indexes for performant queries
MedicalRecordSchema.index({ petId: 1, isDeleted: 1, visitDate: -1 });
MedicalRecordSchema.index({ petId: 1, status: 1, isDeleted: 1 });
MedicalRecordSchema.index({ petId: 1, followUpDate: 1, isDeleted: 1 });

export const MedicalRecordModel: Model<IMedicalRecordDocument> =
  mongoose.models.MedicalRecord ??
  mongoose.model<IMedicalRecordDocument>('MedicalRecord', MedicalRecordSchema);
