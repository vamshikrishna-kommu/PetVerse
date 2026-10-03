import mongoose, { Schema, type Document, type Model } from 'mongoose';
import type { IMedicationInteraction, IMedicationSideEffect, IMedicationContraindication, InteractionSeverity, SideEffectSeverity } from '@petverse/shared-types';

export interface IMedicationInteractionDocument extends Omit<IMedicationInteraction, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

export interface IMedicationSideEffectDocument extends Omit<IMedicationSideEffect, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

export interface IMedicationContraindicationDocument extends Omit<IMedicationContraindication, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const InteractionSchema = new Schema<IMedicationInteractionDocument>({
  primaryMedicationId: { type: String, required: true, index: true },
  interactingEntityId: { type: String, required: true, index: true },
  entityType: { type: String, required: true, enum: ['medication', 'vaccine', 'disease', 'food'] },
  severity: { 
    type: String, 
    required: true,
    enum: ['low', 'moderate', 'high', 'severe', 'fatal'] satisfies InteractionSeverity[]
  },
  description: { type: String, required: true },
  recommendation: { type: String, required: true },
  aiGenerated: { type: Boolean, default: false },
  
  createdBy: { type: String, required: true },
  updatedBy: { type: String },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: String },
  deletedBy: { type: String },
  version: { type: Number, default: 1 },
}, { timestamps: true });

const SideEffectSchema = new Schema<IMedicationSideEffectDocument>({
  petId: { type: String, required: true, index: true },
  medicationId: { type: String, required: true, index: true },
  administrationId: { type: String },
  observedSymptoms: [{ type: String }],
  severity: { 
    type: String, 
    required: true,
    enum: ['mild', 'moderate', 'severe', 'emergency'] satisfies SideEffectSeverity[]
  },
  onsetDateTime: { type: Date, required: true },
  resolved: { type: Boolean, default: false },
  doctorNotes: { type: String },
  requiredEmergency: { type: Boolean, default: false },
  requiredHospitalization: { type: Boolean, default: false },
  
  createdBy: { type: String, required: true },
  updatedBy: { type: String },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: String },
  deletedBy: { type: String },
  version: { type: Number, default: 1 },
}, { timestamps: true });

const ContraindicationSchema = new Schema<IMedicationContraindicationDocument>({
  medicationId: { type: String, required: true, index: true },
  conditionName: { type: String, required: true },
  severity: { 
    type: String, 
    required: true,
    enum: ['low', 'moderate', 'high', 'severe', 'fatal'] satisfies InteractionSeverity[]
  },
  warningMessage: { type: String, required: true },
  
  createdBy: { type: String, required: true },
  updatedBy: { type: String },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: String },
  deletedBy: { type: String },
  version: { type: Number, default: 1 },
}, { timestamps: true });

InteractionSchema.index({ primaryMedicationId: 1, interactingEntityId: 1 }, { unique: true });

export const MedicationInteractionModel: Model<IMedicationInteractionDocument> = 
  mongoose.models.MedicationInteraction || mongoose.model<IMedicationInteractionDocument>('MedicationInteraction', InteractionSchema);

export const MedicationSideEffectModel: Model<IMedicationSideEffectDocument> = 
  mongoose.models.MedicationSideEffect || mongoose.model<IMedicationSideEffectDocument>('MedicationSideEffect', SideEffectSchema);

export const MedicationContraindicationModel: Model<IMedicationContraindicationDocument> = 
  mongoose.models.MedicationContraindication || mongoose.model<IMedicationContraindicationDocument>('MedicationContraindication', ContraindicationSchema);
