import mongoose, { Schema, type Document, type Model } from 'mongoose';
import type { IMedicationCategory, IMedication, MedicationForm } from '@petverse/shared-types';

export interface IMedicationCategoryDocument extends Omit<IMedicationCategory, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

export interface IMedicationDocument extends Omit<IMedication, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const MedicationCategorySchema = new Schema<IMedicationCategoryDocument>({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  colorCode: { type: String, trim: true },
  createdBy: { type: String, required: true },
  updatedBy: { type: String },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: String },
  deletedBy: { type: String },
  version: { type: Number, default: 1 },
}, { timestamps: true });

const MedicationSchema = new Schema<IMedicationDocument>({
  name: { type: String, required: true, trim: true },
  genericName: { type: String, trim: true },
  brand: { type: String, trim: true },
  manufacturer: { type: String, trim: true },
  categoryId: { type: String, required: true, index: true },
  strength: { type: String, required: true, trim: true },
  unit: { type: String, required: true, trim: true },
  form: { 
    type: String, 
    required: true,
    enum: ['tablet', 'capsule', 'liquid', 'injection', 'cream', 'spray', 'drops', 'other'] satisfies MedicationForm[]
  },
  storageInstructions: { type: String, trim: true },
  disposalInstructions: { type: String, trim: true },
  requiresPrescription: { type: Boolean, default: true },
  isControlled: { type: Boolean, default: false },
  barcode: { type: String, trim: true },
  qrCode: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  
  createdBy: { type: String, required: true },
  updatedBy: { type: String },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: String },
  deletedBy: { type: String },
  version: { type: Number, default: 1 },
}, { timestamps: true });

MedicationSchema.index({ name: 'text', genericName: 'text', brand: 'text' });
MedicationSchema.index({ categoryId: 1, isActive: 1 });

export const MedicationCategoryModel: Model<IMedicationCategoryDocument> = 
  mongoose.models.MedicationCategory || mongoose.model<IMedicationCategoryDocument>('MedicationCategory', MedicationCategorySchema);

export const MedicationModel: Model<IMedicationDocument> = 
  mongoose.models.Medication || mongoose.model<IMedicationDocument>('Medication', MedicationSchema);
