import mongoose, { Schema, Document, Model } from 'mongoose';
import type {
  IAdoptionListing,
  IAdoptionApplication,
  AdoptionStatus,
  PetSpecies,
  PetGender,
} from '@petverse/shared-types';

export interface IAdoptionListingDocument extends Omit<IAdoptionListing, '_id'>, Document {}
export interface IAdoptionApplicationDocument extends Omit<IAdoptionApplication, '_id'>, Document {}

const AdoptionListingSchema = new Schema<IAdoptionListingDocument>(
  {
    shelterId: { type: String, required: true, index: true },
    shelterName: { type: String, required: true, trim: true },
    shelterContact: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    species: {
      type: String,
      enum: ['dog', 'cat', 'bird', 'rabbit', 'fish', 'reptile', 'other'] satisfies PetSpecies[],
      required: true,
      index: true,
    },
    breed: { type: String, trim: true },
    age: { type: String, required: true },
    gender: {
      type: String,
      enum: ['male', 'female', 'unknown'] satisfies PetGender[],
      required: true,
    },
    size: {
      type: String,
      enum: ['small', 'medium', 'large', 'giant'],
      default: 'medium',
    },
    description: { type: String, required: true, trim: true, maxlength: 3000 },
    photos: [{ type: String }],
    isVaccinated: { type: Boolean, default: true },
    isSpayedNeutered: { type: Boolean, default: true },
    specialNeeds: { type: String, trim: true },
    location: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['available', 'pending', 'adopted'] satisfies AdoptionStatus[],
      default: 'available',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        ret._id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

AdoptionListingSchema.index({ status: 1, species: 1 });
AdoptionListingSchema.index({ name: 'text', breed: 'text', description: 'text' });

const AdoptionApplicationSchema = new Schema<IAdoptionApplicationDocument>(
  {
    listingId: { type: String, required: true, index: true },
    applicantId: { type: String, required: true, index: true },
    applicantName: { type: String, required: true },
    applicantEmail: { type: String, required: true },
    applicantPhone: { type: String, required: true },
    homeType: {
      type: String,
      enum: ['apartment', 'house_with_yard', 'house_no_yard'],
      required: true,
    },
    hasOtherPets: { type: Boolean, default: false },
    otherPetsDetails: { type: String },
    experienceDescription: { type: String, required: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'approved', 'rejected'],
      default: 'submitted',
      index: true,
    },
    reviewedAt: { type: String },
    reviewNotes: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        ret._id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const AdoptionListingModel: Model<IAdoptionListingDocument> =
  mongoose.models.AdoptionListing ??
  mongoose.model<IAdoptionListingDocument>('AdoptionListing', AdoptionListingSchema);

export const AdoptionApplicationModel: Model<IAdoptionApplicationDocument> =
  mongoose.models.AdoptionApplication ??
  mongoose.model<IAdoptionApplicationDocument>('AdoptionApplication', AdoptionApplicationSchema);
