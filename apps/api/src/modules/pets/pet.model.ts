import mongoose, { Schema, type Document, type Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import type { IPet, PetSpecies, PetGender } from '@petverse/shared-types';

export interface IPetDocument extends Omit<IPet, '_id' | 'ownerId'>, Document {
  ownerId: mongoose.Types.ObjectId;
}

const PetSchema = new Schema<IPetDocument>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    
    // Basic Information
    name: {
      type: String,
      required: [true, 'Pet name is required'],
      trim: true,
      maxlength: 50,
      index: true, // For text searching
    },
    nickname: { type: String, trim: true, maxlength: 50 },
    species: {
      type: String,
      enum: ['dog', 'cat', 'bird', 'rabbit', 'fish', 'reptile', 'other'] satisfies PetSpecies[],
      required: true,
      index: true, // For filtering
    },
    breed: { type: String, trim: true, maxlength: 100, index: true },
    subBreed: { type: String, trim: true, maxlength: 100 },
    gender: {
      type: String,
      enum: ['male', 'female', 'unknown'] satisfies PetGender[],
      default: 'unknown',
    },
    dob: { type: Date },
    estimatedAge: { type: String, trim: true },
    color: { type: String, trim: true, maxlength: 50 },
    weight: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
    bloodGroup: { type: String, trim: true, maxlength: 20 },

    // Identity
    microchipId: { type: String, trim: true, sparse: true },
    qrCode: {
      type: String,
      unique: true,
      default: () => uuidv4(),
      index: true,
    },
    registrationNumber: { type: String, trim: true },
    passportNumber: { type: String, trim: true },

    // Media
    avatar: { type: String },
    gallery: [{ type: String }],

    // Health
    allergies: [{ type: String, trim: true }],
    chronicDiseases: [{ type: String, trim: true }],
    disabilities: [{ type: String, trim: true }],
    currentMedications: [{ type: String, trim: true }],
    isVaccinated: { type: Boolean, default: false },
    isSterilized: { type: Boolean, default: false },

    // Lifestyle
    lifestyle: { type: String, enum: ['indoor', 'outdoor', 'mixed'], default: 'indoor' },
    activityLevel: { type: String, enum: ['low', 'moderate', 'high'], default: 'moderate' },
    favoriteFood: [{ type: String, trim: true }],
    favoriteToys: [{ type: String, trim: true }],
    behaviorNotes: { type: String, trim: true, maxlength: 1000 },

    // Ownership
    adoptionDate: { type: Date },
    shelterName: { type: String, trim: true, maxlength: 100 },
    insuranceProvider: { type: String, trim: true, maxlength: 100 },
    insuranceExpiry: { type: Date },

    // System
    isAdopted: { type: Boolean, default: false },
    isLost: { type: Boolean, default: false, index: true },
    isPublicProfile: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        ret._id = (ret._id as mongoose.Types.ObjectId).toString();
        ret.ownerId = (ret.ownerId as mongoose.Types.ObjectId).toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for optimal queries
PetSchema.index({ ownerId: 1, species: 1, createdAt: -1 });
PetSchema.index({ name: 'text', breed: 'text' }); // Text search

export const PetModel: Model<IPetDocument> =
  mongoose.models.Pet ?? mongoose.model<IPetDocument>('Pet', PetSchema);
