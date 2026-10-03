import mongoose, { Schema, type Document, type Model } from 'mongoose';
import type { IClinic } from '@petverse/shared-types';

export interface IClinicDocument extends Omit<IClinic, '_id' | 'ownerId'>, Document {
  _id: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  type: 'veterinary_clinic' | 'emergency_hospital' | 'groomer' | 'boarding' | 'trainer' | 'shelter' | 'other';
  emergencyAvailable?: boolean;
  weeklySchedule?: Record<string, any>;
  slotDuration?: number;
  holidays?: string[];
  blackoutDates?: string[];
  timezone?: string;
}

const ClinicSchema = new Schema<IClinicDocument>(
  {
    name: {
      type: String,
      required: [true, 'Clinic name is required'],
      trim: true,
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['veterinary_clinic', 'emergency_hospital', 'groomer', 'boarding', 'trainer', 'shelter', 'other'],
      default: 'veterinary_clinic',
      index: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    website: { type: String, trim: true },
    services: [{ type: String, trim: true }],
    openingHours: {
      type: Schema.Types.Mixed,
      default: {
        monday: { open: '08:00', close: '18:00' },
        tuesday: { open: '08:00', close: '18:00' },
        wednesday: { open: '08:00', close: '18:00' },
        thursday: { open: '08:00', close: '18:00' },
        friday: { open: '08:00', close: '18:00' },
        saturday: { open: '09:00', close: '15:00' },
        sunday: { open: '10:00', close: '16:00' },
      },
    },
    weeklySchedule: {
      type: Schema.Types.Mixed,
      default: {
        monday: { isOpen: true, open: '09:00', close: '17:00', breaks: [{ start: '12:00', end: '13:00' }] },
        tuesday: { isOpen: true, open: '09:00', close: '17:00', breaks: [{ start: '12:00', end: '13:00' }] },
        wednesday: { isOpen: true, open: '09:00', close: '17:00', breaks: [{ start: '12:00', end: '13:00' }] },
        thursday: { isOpen: true, open: '09:00', close: '17:00', breaks: [{ start: '12:00', end: '13:00' }] },
        friday: { isOpen: true, open: '09:00', close: '17:00', breaks: [{ start: '12:00', end: '13:00' }] },
        saturday: { isOpen: true, open: '10:00', close: '14:00', breaks: [] },
        sunday: { isOpen: true, open: '10:00', close: '16:00', breaks: [] },
      },
    },
    slotDuration: { type: Number, default: 30 },
    holidays: [{ type: String }],
    blackoutDates: [{ type: String }],
    timezone: { type: String, default: 'UTC' },
    photos: [{ type: String }],
    ratings: {
      avg: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 },
    },
    isVerified: { type: Boolean, default: true },
    emergencyAvailable: { type: Boolean, default: false },
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

// 2dsphere index for geospatial proximity queries
ClinicSchema.index({ location: '2dsphere' });
ClinicSchema.index({ type: 1, 'ratings.avg': -1 });

export const ClinicModel: Model<IClinicDocument> =
  mongoose.models.Clinic || mongoose.model<IClinicDocument>('Clinic', ClinicSchema);
