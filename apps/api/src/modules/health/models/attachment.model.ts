import mongoose, { Schema, type Document, type Model } from 'mongoose';
import type { IAttachmentFile, AttachmentEntityType } from '@petverse/shared-types';

export interface IAttachmentFileDocument
  extends Omit<IAttachmentFile, '_id' | 'petId' | 'entityId' | 'uploadedBy' | 'createdBy' | 'updatedBy' | 'deletedBy' | 'createdAt' | 'updatedAt'>,
    Document {
  petId: mongoose.Types.ObjectId;
  entityId: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  deletedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AttachmentSchema = new Schema<IAttachmentFileDocument>(
  {
    petId: { type: Schema.Types.ObjectId, ref: 'Pet', required: true, index: true },
    entityType: {
      type: String,
      required: true,
      enum: ['medical_record', 'lab_report', 'imaging', 'surgery', 'prescription'] satisfies AttachmentEntityType[],
    },
    entityId: { type: Schema.Types.ObjectId, required: true },

    url: { type: String, required: true },
    publicId: { type: String, required: true },
    filename: { type: String, required: true, trim: true, maxlength: 300 },
    mimeType: { type: String, required: true, maxlength: 100 },
    sizeBytes: { type: Number, required: true, min: 0 },

    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    version: { type: Number, default: 1 },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, unknown>) => {
        ret._id = (ret._id as mongoose.Types.ObjectId).toString();
        ret.petId = (ret.petId as mongoose.Types.ObjectId).toString();
        ret.entityId = (ret.entityId as mongoose.Types.ObjectId).toString();
        ret.uploadedBy = (ret.uploadedBy as mongoose.Types.ObjectId).toString();
        delete ret.__v;
        delete ret.isDeleted;
        return ret;
      },
    },
  }
);

// Fetch all attachments for a given entity quickly
AttachmentSchema.index({ entityType: 1, entityId: 1, isDeleted: 1 });
AttachmentSchema.index({ petId: 1, isDeleted: 1, createdAt: -1 });

export const AttachmentModel: Model<IAttachmentFileDocument> =
  mongoose.models.HealthAttachment ??
  mongoose.model<IAttachmentFileDocument>('HealthAttachment', AttachmentSchema);
