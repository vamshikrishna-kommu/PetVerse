import mongoose, { Schema, type Document, type Model } from 'mongoose';
import type { IMedicationCourse, IMedicationAdministration, IMedicationCompliance, CourseStatus, AdministrationStatus } from '@petverse/shared-types';

export interface IMedicationCourseDocument extends Omit<IMedicationCourse, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

export interface IMedicationAdministrationDocument extends Omit<IMedicationAdministration, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

export interface IMedicationComplianceDocument extends Omit<IMedicationCompliance, '_id'>, Document {
  _id: mongoose.Types.ObjectId;
}

const CourseSchema = new Schema<IMedicationCourseDocument>({
  prescriptionItemId: { type: String, required: true, index: true },
  petId: { type: String, required: true, index: true },
  status: { 
    type: String, 
    required: true,
    enum: ['started', 'paused', 'resumed', 'completed', 'cancelled', 'missed', 'skipped'] satisfies CourseStatus[],
    default: 'started'
  },
  startedAt: { type: Date, required: true },
  completedAt: { type: Date },
  pausedAt: { type: Date },
  totalDosesExpected: { type: Number, required: true, default: 0 },
  dosesCompleted: { type: Number, required: true, default: 0 },
  dosesMissed: { type: Number, required: true, default: 0 },
  completionPercentage: { type: Number, required: true, default: 0 },
  
  createdBy: { type: String, required: true },
  updatedBy: { type: String },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: String },
  deletedBy: { type: String },
  version: { type: Number, default: 1 },
}, { timestamps: true });

const AdministrationSchema = new Schema<IMedicationAdministrationDocument>({
  courseId: { type: String, required: true, index: true },
  petId: { type: String, required: true, index: true },
  medicationId: { type: String, required: true },
  administeredAt: { type: Date, required: true },
  scheduledAt: { type: Date, required: true },
  status: { 
    type: String, 
    required: true,
    enum: ['completed', 'missed', 'late', 'skipped', 'vomited'] satisfies AdministrationStatus[]
  },
  administeredBy: { type: String, required: true },
  doseGiven: { type: String, required: true },
  notes: { type: String },
  reactionReported: { type: Boolean, default: false },
  photoProofUrl: { type: String },
  
  createdBy: { type: String, required: true },
  updatedBy: { type: String },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: String },
  deletedBy: { type: String },
  version: { type: Number, default: 1 },
}, { timestamps: true });

const ComplianceSchema = new Schema<IMedicationComplianceDocument>({
  petId: { type: String, required: true, index: true },
  courseId: { type: String, required: true, index: true },
  compliancePercentage: { type: Number, required: true, default: 0 },
  completedDoses: { type: Number, required: true, default: 0 },
  missedDoses: { type: Number, required: true, default: 0 },
  lateDoses: { type: Number, required: true, default: 0 },
  currentStreak: { type: Number, required: true, default: 0 },
  longestStreak: { type: Number, required: true, default: 0 },
  adherenceScore: { type: Number, required: true, default: 0 },
  lastCalculatedAt: { type: Date, required: true },
  
  createdBy: { type: String, required: true },
  updatedBy: { type: String },
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: String },
  deletedBy: { type: String },
  version: { type: Number, default: 1 },
}, { timestamps: true });

CourseSchema.index({ petId: 1, status: 1 });
AdministrationSchema.index({ courseId: 1, scheduledAt: -1 });
AdministrationSchema.index({ petId: 1, administeredAt: -1 });

export const MedicationCourseModel: Model<IMedicationCourseDocument> = 
  mongoose.models.MedicationCourse || mongoose.model<IMedicationCourseDocument>('MedicationCourse', CourseSchema);

export const MedicationAdministrationModel: Model<IMedicationAdministrationDocument> = 
  mongoose.models.MedicationAdministration || mongoose.model<IMedicationAdministrationDocument>('MedicationAdministration', AdministrationSchema);

export const MedicationComplianceModel: Model<IMedicationComplianceDocument> = 
  mongoose.models.MedicationCompliance || mongoose.model<IMedicationComplianceDocument>('MedicationCompliance', ComplianceSchema);
