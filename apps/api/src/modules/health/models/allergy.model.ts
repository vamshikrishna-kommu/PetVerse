import mongoose, { Schema, type Document, type Model } from 'mongoose';
import type { IAllergy, AllergyType, AllergySeverity } from '@petverse/shared-types';

export interface IAllergyDocument
  extends Omit<IAllergy, '_id' | 'petId' | 'ownerId' | 'createdBy' | 'updatedBy' | 'deletedBy' | 'createdAt' | 'updatedAt'>,
    Document {
  petId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  deletedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AllergySchema = new Schema<IAllergyDocument>(
  {
    petId: { type: Schema.Types.ObjectId, ref: 'Pet', required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    allergenType: {
      type: String,
      required: true,
      enum: ['medication', 'food', 'environmental', 'contact'] satisfies AllergyType[],
    },
    allergen: { type: String, required: true, trim: true, maxlength: 200 },
    severity: {
      type: String,
      required: true,
      enum: ['mild', 'moderate', 'severe', 'anaphylactic'] satisfies AllergySeverity[],
    },
    reaction: { type: String, required: true, trim: true, maxlength: 1000 },
    symptoms: [{ type: String, trim: true }],

    isEmergencyFlag: { type: Boolean, default: false },

    firstObservedDate: { type: String },
    confirmedByVet: { type: Boolean, default: false },
    confirmedByVetName: { type: String, trim: true, maxlength: 200 },

    managementPlan: { type: String, trim: true, maxlength: 2000 },
    avoidanceInstructions: { type: String, trim: true, maxlength: 2000 },

    // AI compatibility
    aiMetadata: { type: Schema.Types.Mixed },

    // Audit
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
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

AllergySchema.index({ petId: 1, isDeleted: 1 });
AllergySchema.index({ petId: 1, isEmergencyFlag: 1, isDeleted: 1 });
AllergySchema.index({ petId: 1, severity: 1, isDeleted: 1 });

export const AllergyModel: Model<IAllergyDocument> =
  mongoose.models.Allergy ??
  mongoose.model<IAllergyDocument>('Allergy', AllergySchema);
