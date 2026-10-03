import { Schema, model, Document, Types } from 'mongoose';
import type { IVaccinationRecord, IVaccinationDose } from '@petverse/shared-types';

export interface IVaccinationRecordDocument extends Omit<IVaccinationRecord, '_id' | 'petId' | 'ownerId' | 'vaccineId' | 'createdBy' | 'updatedBy' | 'deletedBy' | 'certificateIds'>, Document {
  petId: Types.ObjectId;
  ownerId: Types.ObjectId;
  vaccineId: Types.ObjectId;
  certificateIds: Types.ObjectId[];
  doses: Types.DocumentArray<IVaccinationDose>;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedBy?: Types.ObjectId;
}

const doseSchema = new Schema<IVaccinationDose>({
  doseNumber: { type: Number, required: true },
  doseType: { type: String, required: true, enum: ['primary', 'booster', 'annual', 'catch_up'] },
  dueDate: { type: String, required: true },
  administeredDate: { type: String },
  status: { 
    type: String, 
    required: true,
    enum: ['upcoming', 'completed', 'overdue', 'skipped', 'cancelled', 'exempted']
  },
  administeredBy: { type: String }, // Stored as string or Vet ObjectId
  clinicName: { type: String },
  batchNumber: { type: String },
  manufacturer: { type: String },
  brand: { type: String },
  route: { type: String, enum: ['subcutaneous', 'intramuscular', 'intranasal', 'oral'] },
  injectionSite: { type: String },
  reactionId: { type: String },
  notes: { type: String }
});

const vaccinationRecordSchema = new Schema<IVaccinationRecordDocument>(
  {
    petId: { type: Schema.Types.ObjectId, ref: 'Pet', required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    vaccineId: { type: Schema.Types.ObjectId, ref: 'VaccineDefinition', required: true, index: true },
    
    status: { type: String, required: true, enum: ['in_progress', 'completed', 'expired'] },
    currentDoseNumber: { type: Number, default: 0 },
    
    doses: [doseSchema],
    
    certificateIds: [{ type: Schema.Types.ObjectId, ref: 'VaccinationCertificate' }],
    validUntil: { type: String },
    
    notes: { type: String },
    aiMetadata: { type: Schema.Types.Mixed },
    
    // Audit fields
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: String },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    version: { type: Number, default: 1 }
  },
  { timestamps: true }
);

export const VaccinationRecord = model<IVaccinationRecordDocument>('VaccinationRecord', vaccinationRecordSchema);
