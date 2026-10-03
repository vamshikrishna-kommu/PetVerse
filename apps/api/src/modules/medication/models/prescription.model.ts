import mongoose, { Schema, type Document, type Model } from 'mongoose';
import type { IPrescription, IPrescriptionItem, PrescriptionStatus, MedicationRoute, IMedicationSchedule } from '@petverse/shared-types';

export interface IPrescriptionDocument extends Omit<IPrescription, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

export interface IPrescriptionItemDocument extends Omit<IPrescriptionItem, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const PrescriptionSchema = new Schema<IPrescriptionDocument>({
  petId: { type: String, required: true, index: true },
  ownerId: { type: String, required: true },
  hospitalId: { type: String },
  doctorId: { type: String },
  diagnosisLinkageId: { type: String },
  medicalRecordId: { type: String },
  vaccinationRecordId: { type: String },
  status: { 
    type: String, 
    required: true,
    enum: ['active', 'completed', 'discontinued', 'on_hold'] satisfies PrescriptionStatus[],
    default: 'active'
  },
  issuedAt: { type: Date, required: true },
  expiresAt: { type: Date },
  refillCount: { type: Number, default: 0 },
  refillsUsed: { type: Number, default: 0 },
  notes: { type: String },
  
  createdBy: { type: String, required: true },
  updatedBy: { type: String },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: String },
  deletedBy: { type: String },
  version: { type: Number, default: 1 },
}, { timestamps: true });

const MedicationScheduleSchema = new Schema<IMedicationSchedule>({
  morning: { type: Boolean, default: false },
  afternoon: { type: Boolean, default: false },
  evening: { type: Boolean, default: false },
  night: { type: Boolean, default: false },
  beforeFood: { type: Boolean, default: false },
  afterFood: { type: Boolean, default: false },
  everyXHours: { type: Number },
  customCron: { type: String },
  weightBased: { type: Boolean, default: false },
  ageBased: { type: Boolean, default: false },
  conditionalRule: { type: String },
}, { _id: false });

const PrescriptionItemSchema = new Schema<IPrescriptionItemDocument>({
  prescriptionId: { type: String, required: true, index: true },
  medicationId: { type: String, required: true },
  dosage: { type: String, required: true },
  route: { 
    type: String, 
    required: true,
    enum: ['oral', 'topical', 'injectable', 'inhaled', 'ophthalmic', 'otic', 'rectal', 'other'] satisfies MedicationRoute[]
  },
  frequencyRule: { type: String, required: true },
  schedule: { type: MedicationScheduleSchema, required: true },
  durationDays: { type: Number, required: true },
  quantity: { type: Number, required: true },
  specialInstructions: { type: String },
  
  createdBy: { type: String, required: true },
  updatedBy: { type: String },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: String },
  deletedBy: { type: String },
  version: { type: Number, default: 1 },
}, { timestamps: true });

PrescriptionSchema.index({ petId: 1, status: 1 });
PrescriptionItemSchema.index({ prescriptionId: 1, medicationId: 1 });

export const PrescriptionModel: Model<IPrescriptionDocument> = 
  mongoose.models.MedicationPrescription || mongoose.model<IPrescriptionDocument>('MedicationPrescription', PrescriptionSchema);

export const PrescriptionItemModel: Model<IPrescriptionItemDocument> = 
  mongoose.models.PrescriptionItem || mongoose.model<IPrescriptionItemDocument>('PrescriptionItem', PrescriptionItemSchema);
