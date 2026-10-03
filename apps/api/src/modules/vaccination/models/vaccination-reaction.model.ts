import { Schema, model, Document, Types } from 'mongoose';
import type { IVaccinationReaction } from '@petverse/shared-types';

export interface IVaccinationReactionDocument extends Omit<IVaccinationReaction, '_id' | 'petId' | 'vaccinationRecordId' | 'doseId' | 'createdBy' | 'updatedBy' | 'deletedBy'>, Document {
  petId: Types.ObjectId;
  vaccinationRecordId: Types.ObjectId;
  doseId: Types.ObjectId;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedBy?: Types.ObjectId;
}

const vaccinationReactionSchema = new Schema<IVaccinationReactionDocument>(
  {
    petId: { type: Schema.Types.ObjectId, ref: 'Pet', required: true, index: true },
    vaccinationRecordId: { type: Schema.Types.ObjectId, ref: 'VaccinationRecord', required: true, index: true },
    doseId: { type: Schema.Types.ObjectId, required: true }, // Not ref because dose is embedded
    
    severity: { 
      type: String, 
      required: true, 
      enum: ['none', 'mild', 'moderate', 'severe', 'emergency'] 
    },
    symptoms: [{ type: String }],
    onsetDateTime: { type: String, required: true },
    recoveryDateTime: { type: String },
    
    vetEvaluated: { type: Boolean, default: false },
    vetNotes: { type: String },
    medicationGiven: [{ type: String }],
    hospitalizationRequired: { type: Boolean, default: false },
    
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

export const VaccinationReaction = model<IVaccinationReactionDocument>('VaccinationReaction', vaccinationReactionSchema);
