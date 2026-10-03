import mongoose, { Schema, type Document, type Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import type { IUser, UserRole } from '@petverse/shared-types';

// ─── Document Interface ────────────────────────────────────
export interface IUserDocument extends Omit<IUser, '_id'>, Document {
  passwordHash?: string;
  refreshTokenHash?: string;
  googleId?: string;
  otpHash?: string;
  otpExpiry?: Date;
  resetTokenHash?: string;
  resetTokenExpiry?: Date;
  failedLoginAttempts?: number;
  lockUntil?: Date;
  isLocked?: boolean;
  comparePassword(password: string): Promise<boolean>;
}

// ─── Schema ────────────────────────────────────────────────
const UserSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
      index: true,
    },
    phone: { type: String, trim: true },
    passwordHash: { type: String, select: false },
    googleId: { type: String, sparse: true, index: true },
    role: {
      type: String,
      enum: ['pet_owner', 'vet', 'shelter', 'admin'] satisfies UserRole[],
      default: 'pet_owner',
    },
    profile: {
      firstName: { type: String, required: true, trim: true, maxlength: 50 },
      lastName: { type: String, required: true, trim: true, maxlength: 50 },
      avatar: { type: String },
      bio: { type: String, maxlength: 500 },
      location: {
        type: {
          type: String,
          enum: ['Point'],
        },
        coordinates: {
          type: [Number],
          default: undefined,
        },
      },
    },
    fcmToken: { type: String, select: false },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    refreshTokenHash: { type: String, select: false },
    otpHash: { type: String, select: false },
    otpExpiry: { type: Date, select: false },
    resetTokenHash: { type: String, select: false },
    resetTokenExpiry: { type: Date, select: false },
    failedLoginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, select: false },
    preferences: {
      type: Schema.Types.Mixed,
      default: {
        notifications: {
          email: true,
          push: true,
          appointmentReminders: true,
          vaccinationReminders: true,
          medicationReminders: true,
          healthAlerts: true,
          marketing: false,
        },
        privacy: {
          publicPetProfile: true,
          qrVisibility: true,
          locationSharing: false,
          contactPreference: 'in_app',
        },
        appearance: {
          theme: 'system',
        },
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        delete ret.passwordHash;
        delete ret.refreshTokenHash;
        delete ret.googleId;
        delete ret.otpHash;
        delete ret.otpExpiry;
        delete ret.resetTokenHash;
        delete ret.resetTokenExpiry;
        delete ret.failedLoginAttempts;
        delete ret.lockUntil;
        delete ret.__v;
        ret._id = (ret._id as mongoose.Types.ObjectId).toString();
        return ret;
      },
    },
  }
);

UserSchema.virtual('isLocked').get(function (this: IUserDocument) {
  return !!(this.lockUntil && this.lockUntil.getTime() > Date.now());
});

// ─── Geospatial Index ──────────────────────────────────────
UserSchema.index({ 'profile.location': '2dsphere' });

// ─── Instance Methods ──────────────────────────────────────
UserSchema.methods.comparePassword = async function (
  password: string
): Promise<boolean> {
  if (!this.passwordHash) return false;
  return bcrypt.compare(password, this.passwordHash);
};

// ─── Model ────────────────────────────────────────────────
export const UserModel: Model<IUserDocument> =
  mongoose.models.User ?? mongoose.model<IUserDocument>('User', UserSchema);
