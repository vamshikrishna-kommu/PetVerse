import mongoose, { Schema, type Document, type Model } from 'mongoose';
import type { IImagingStudy, IImagingImage, ImagingType, StudyStatus } from '@petverse/shared-types';

export interface IImagingStudyDocument
  extends Omit<IImagingStudy, '_id' | 'petId' | 'ownerId' | 'createdBy' | 'updatedBy' | 'deletedBy' | 'createdAt' | 'updatedAt' | 'linkedVisitId' | 'comparedWithStudyId'>,
    Document {
  petId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  linkedVisitId?: mongoose.Types.ObjectId;
  comparedWithStudyId?: mongoose.Types.ObjectId;
}

const ImagingImageSchema = new Schema<IImagingImage>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    thumbnailUrl: { type: String },
    label: { type: String, trim: true, maxlength: 200 },
  },
  { _id: false }
);

const ImagingStudySchema = new Schema<IImagingStudyDocument>(
  {
    petId: { type: Schema.Types.ObjectId, ref: 'Pet', required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    studyType: {
      type: String,
      required: true,
      enum: ['xray', 'mri', 'ct', 'ultrasound', 'ecg', 'other'] satisfies ImagingType[],
    },
    bodyRegion: { type: String, required: true, trim: true, maxlength: 200 },
    orderedBy: { type: String, trim: true, maxlength: 200 },
    performedDate: { type: String },

    images: [ImagingImageSchema],

    status: {
      type: String,
      enum: ['ordered', 'performed', 'interpreted', 'reviewed'] satisfies StudyStatus[],
      default: 'ordered',
    },
    vetInterpretation: { type: String, trim: true, maxlength: 5000 },
    impression: { type: String, trim: true, maxlength: 2000 },
    recommendations: { type: String, trim: true, maxlength: 2000 },

    comparedWithStudyId: { type: Schema.Types.ObjectId, ref: 'ImagingStudy' },
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
        if (ret.comparedWithStudyId) {
          ret.comparedWithStudyId = (ret.comparedWithStudyId as mongoose.Types.ObjectId).toString();
        }
        delete ret.__v;
        delete ret.isDeleted;
        return ret;
      },
    },
  }
);

ImagingStudySchema.index({ petId: 1, isDeleted: 1, performedDate: -1 });
ImagingStudySchema.index({ petId: 1, studyType: 1, isDeleted: 1 });

export const ImagingStudyModel: Model<IImagingStudyDocument> =
  mongoose.models.ImagingStudy ??
  mongoose.model<IImagingStudyDocument>('ImagingStudy', ImagingStudySchema);
