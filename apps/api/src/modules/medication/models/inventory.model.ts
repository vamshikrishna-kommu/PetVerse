import mongoose, { Schema, type Document, type Model } from 'mongoose';
import type { IMedicationInventory, IMedicationRefill, IMedicationTemplate, IMedicationHistory } from '@petverse/shared-types';

export interface IMedicationInventoryDocument extends Omit<IMedicationInventory, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

export interface IMedicationRefillDocument extends Omit<IMedicationRefill, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

export interface IMedicationTemplateDocument extends Omit<IMedicationTemplate, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

export interface IMedicationHistoryDocument extends Omit<IMedicationHistory, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const InventorySchema = new Schema<IMedicationInventoryDocument>({
  medicationId: { type: String, required: true, index: true },
  hospitalId: { type: String, required: true, index: true },
  currentStock: { type: Number, required: true, default: 0 },
  minimumStock: { type: Number, required: true, default: 0 },
  batchNumber: { type: String, required: true },
  expiryDate: { type: Date, required: true },
  
  createdBy: { type: String, required: true },
  updatedBy: { type: String },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: String },
  deletedBy: { type: String },
  version: { type: Number, default: 1 },
}, { timestamps: true });

const RefillSchema = new Schema<IMedicationRefillDocument>({
  prescriptionId: { type: String, required: true, index: true },
  petId: { type: String, required: true, index: true },
  requestedAt: { type: Date, required: true },
  approvedAt: { type: Date },
  status: { type: String, required: true, enum: ['pending', 'approved', 'rejected', 'fulfilled'] },
  notes: { type: String },
  
  createdBy: { type: String, required: true },
  updatedBy: { type: String },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: String },
  deletedBy: { type: String },
  version: { type: Number, default: 1 },
}, { timestamps: true });

const TemplateSchema = new Schema<IMedicationTemplateDocument>({
  name: { type: String, required: true },
  hospitalId: { type: String },
  medicationId: { type: String, required: true },
  defaultDosage: { type: String, required: true },
  defaultFrequency: { type: String, required: true },
  defaultDurationDays: { type: Number, required: true },
  instructions: { type: String, required: true },
  
  createdBy: { type: String, required: true },
  updatedBy: { type: String },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: String },
  deletedBy: { type: String },
  version: { type: Number, default: 1 },
}, { timestamps: true });

const HistorySchema = new Schema<IMedicationHistoryDocument>({
  petId: { type: String, required: true, index: true },
  medicationId: { type: String, required: true, index: true },
  action: { type: String, required: true, enum: ['prescribed', 'started', 'paused', 'stopped', 'completed', 'refilled'] },
  actionDate: { type: Date, required: true },
  description: { type: String, required: true },
  
  createdBy: { type: String, required: true },
  updatedBy: { type: String },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: String },
  deletedBy: { type: String },
  version: { type: Number, default: 1 },
}, { timestamps: true });

export const MedicationInventoryModel: Model<IMedicationInventoryDocument> = 
  mongoose.models.MedicationInventory || mongoose.model<IMedicationInventoryDocument>('MedicationInventory', InventorySchema);

export const MedicationRefillModel: Model<IMedicationRefillDocument> = 
  mongoose.models.MedicationRefill || mongoose.model<IMedicationRefillDocument>('MedicationRefill', RefillSchema);

export const MedicationTemplateModel: Model<IMedicationTemplateDocument> = 
  mongoose.models.MedicationTemplate || mongoose.model<IMedicationTemplateDocument>('MedicationTemplate', TemplateSchema);

export const MedicationHistoryModel: Model<IMedicationHistoryDocument> = 
  mongoose.models.MedicationHistory || mongoose.model<IMedicationHistoryDocument>('MedicationHistory', HistorySchema);
