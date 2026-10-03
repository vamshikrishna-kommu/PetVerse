import { Schema, model, Document, Types } from 'mongoose';
import type { IVaccineDefinition, VaccineCategory } from '@petverse/shared-types';

export interface IVaccineDefinitionDocument extends Omit<IVaccineDefinition, '_id' | 'createdBy' | 'updatedBy' | 'deletedBy'>, Document {
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedBy?: Types.ObjectId;
}

const vaccineDefinitionSchema = new Schema<IVaccineDefinitionDocument>(
  {
    name: { type: String, required: true, trim: true },
    scientificName: { type: String, required: true, trim: true },
    category: { 
      type: String, 
      required: true, 
      enum: ['core', 'non_core', 'lifestyle', 'travel'] 
    },
    species: [{ type: String, required: true }],
    description: { type: String },
    diseasePrevention: [{ type: String }],
    defaultSchedule: {
      primaryDoses: { type: Number, required: true },
      intervalDays: { type: Number, required: true },
      boosterFrequencyMonths: { type: Number, required: true },
      minAgeWeeks: { type: Number, required: true },
    },
    isActive: { type: Boolean, default: true },
    
    // Audit fields
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Indexes
vaccineDefinitionSchema.index({ name: 1 });
vaccineDefinitionSchema.index({ species: 1 });

export const VaccineDefinition = model<IVaccineDefinitionDocument>('VaccineDefinition', vaccineDefinitionSchema);
