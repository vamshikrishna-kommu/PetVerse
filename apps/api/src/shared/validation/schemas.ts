/**
 * Shared Zod validation schemas used across API route files.
 * Keeps validation logic in one place and avoids duplication.
 */
import { z } from 'zod';

// ─── Common / Primitives ─────────────────────────────────────
export const mongoId = z
  .string()
  .min(24)
  .max(24)
  .regex(/^[a-f\d]{24}$/i, 'Must be a valid MongoDB ObjectId');

export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a valid date in YYYY-MM-DD format');

export const isoDatetime = z
  .string()
  .datetime({ message: 'Must be a valid ISO 8601 datetime string' });

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ─── Reminder Schemas ────────────────────────────────────────
export const createReminderSchema = z.object({
  petId: mongoId,
  type: z.enum(['medication', 'vaccination', 'appointment', 'grooming', 'checkup', 'other']),
  title: z.string().min(1).max(200),
  message: z.string().max(1000).optional(),
  frequency: z.enum(['once', 'daily', 'weekly', 'monthly', 'custom']),
  cronExpression: z.string().max(100).optional(),
  nextTrigger: isoDatetime,
  priority: z.enum(['low', 'medium', 'high', 'critical', 'emergency']).default('medium'),
  escalation: z
    .object({
      maxRetries: z.number().int().min(0).max(10).default(0),
      retryIntervalMinutes: z.number().int().min(5).max(1440).default(60),
      notifySecondaryOwner: z.boolean().default(false),
      emergencyEscalation: z.boolean().default(false),
    })
    .optional(),
  notificationChannels: z
    .array(z.enum(['push', 'email', 'sms', 'in-app', 'silent']))
    .default(['in-app', 'push']),
  timezone: z.string().default('UTC'),
  linkedEntityId: z.string().optional(),
});

export const snoozeReminderSchema = z.object({
  hours: z.number().int().min(1).max(168).default(1), // max 1 week snooze
});

// ─── Appointment Schemas ──────────────────────────────────────
export const bookAppointmentSchema = z.object({
  petId: mongoId,
  clinicId: z.string().max(200).optional().nullable().transform((val) => val || undefined),
  clinicName: z.string().max(200).optional(),
  clinicAddress: z.string().max(500).optional(),
  appointmentDate: isoDate,
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Must be in HH:mm format (e.g. "14:30")'),
  type: z.enum(['checkup', 'vaccination', 'surgery', 'grooming', 'consultation']),
  notes: z.string().max(1000).optional().nullable().transform((val) => val || undefined),
  fee: z.number().min(0, 'Fee cannot be negative').optional(),
});

export const cancelAppointmentSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const rescheduleAppointmentSchema = z.object({
  appointmentDate: isoDate,
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Must be in HH:mm format (e.g. "14:30")'),
});

export const getAvailableSlotsSchema = z.object({
  clinicId: z.string().optional(),
  date: isoDate.default(() => new Date().toISOString().split('T')[0]),
});

// ─── User Schemas ────────────────────────────────────────────
export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional().nullable(),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{6,14}$/, 'Invalid phone number format')
    .optional()
    .nullable(),
});

// ─── Notification Schemas ─────────────────────────────────────
export const markNotificationReadSchema = z.object({
  ids: z.array(mongoId).min(1).max(100),
});

// ─── Growth Schemas ───────────────────────────────────────────
export const createGrowthLogSchema = z.object({
  weight: z.number().positive().optional(),
  height: z.number().positive().optional(),
  notes: z.string().max(500).optional(),
  measuredAt: isoDatetime.optional(),
});

// ─── Nearby / Review Schemas ──────────────────────────────────
export const addReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(1).max(1000),
});

// ─── Auth Schemas (supplemental — auth.routes.ts already has its own) ─
export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(32),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain number')
    .regex(/[^A-Za-z0-9]/, 'Must contain special character'),
});

// ─── Event Schemas ────────────────────────────────────────────
export const dispatchEventSchema = z.object({
  aggregateId: z.string().min(1).max(100),
  aggregateType: z.string().min(1).max(100),
  eventType: z.string().min(1),
  payload: z.record(z.unknown()),
});

// ─── Health Record Schemas ────────────────────────────────────
export const createVisitSchema = z.object({
  visitType: z.enum([
    'routine_checkup', 'emergency', 'follow_up', 'vaccination',
    'surgery', 'dental', 'dermatology', 'ophthalmology', 'cardiology',
    'neurology', 'oncology', 'orthopedic', 'radiology', 'other',
  ]),
  visitDate: isoDate,
  visitReason: z.string().min(1).max(500),
  vetName: z.string().max(100).optional(),
  clinicName: z.string().max(100).optional(),
  physicalExam: z.string().max(2000).optional(),
  assessment: z.string().max(2000).optional(),
  plan: z.string().max(2000).optional(),
  followUpRequired: z.boolean().default(false),
  followUpDate: isoDate.optional(),
  fee: z.number().nonnegative().optional(),
  notes: z.string().max(2000).optional(),
});

export const logVitalSchema = z.object({
  weight: z.number().positive().optional(),
  temperature: z.number().optional(),
  heartRate: z.number().positive().int().optional(),
  respiratoryRate: z.number().positive().int().optional(),
  bloodPressureSystolic: z.number().positive().int().optional(),
  bloodPressureDiastolic: z.number().positive().int().optional(),
  oxygenSaturation: z.number().min(0).max(100).optional(),
  notes: z.string().max(500).optional(),
  recordedAt: isoDatetime.optional(),
});

export const addConditionSchema = z.object({
  name: z.string().min(1).max(200),
  severity: z.enum(['mild', 'moderate', 'severe', 'critical']).optional(),
  diagnosedDate: isoDate.optional(),
  status: z.enum(['active', 'resolved', 'managed', 'monitoring']).default('active'),
  notes: z.string().max(2000).optional(),
});

export const addAllergySchema = z.object({
  allergen: z.string().min(1).max(200),
  allergenType: z.enum(['food', 'environmental', 'medication', 'contact', 'other']).optional(),
  severity: z.enum(['mild', 'moderate', 'severe', 'life_threatening']).optional(),
  reaction: z.string().max(500).optional(),
  diagnosedDate: isoDate.optional(),
  notes: z.string().max(1000).optional(),
});

// ─── Vaccination Schemas ──────────────────────────────────────
export const recordVaccinationSchema = z.object({
  vaccineId: z.string().min(1),
  status: z.enum(['scheduled', 'in_progress', 'completed', 'missed', 'cancelled']).default('in_progress'),
  currentDoseNumber: z.number().int().positive().default(1),
  notes: z.string().max(1000).optional(),
  doses: z.array(z.record(z.unknown())).optional(),
});

export const recordReactionSchema = z.object({
  vaccinationRecordId: z.string().min(1),
  severity: z.enum(['none', 'mild', 'moderate', 'severe', 'emergency']),
  symptoms: z.array(z.string()).min(1),
  onsetDateTime: isoDatetime.optional(),
  vetEvaluated: z.boolean().default(false),
  vetNotes: z.string().max(1000).optional(),
  medicationGiven: z.string().optional(),
  hospitalizationRequired: z.boolean().default(false),
});
