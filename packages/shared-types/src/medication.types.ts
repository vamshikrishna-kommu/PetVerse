import type { IAuditFields } from './index';

export type MedicationForm = 'tablet' | 'capsule' | 'liquid' | 'injection' | 'cream' | 'spray' | 'drops' | 'other';
export type MedicationRoute = 'oral' | 'topical' | 'injectable' | 'inhaled' | 'ophthalmic' | 'otic' | 'rectal' | 'other';
export type PrescriptionStatus = 'active' | 'completed' | 'discontinued' | 'on_hold';
export type CourseStatus = 'started' | 'paused' | 'resumed' | 'completed' | 'cancelled' | 'missed' | 'skipped';
export type AdministrationStatus = 'completed' | 'missed' | 'late' | 'skipped' | 'vomited';
export type InteractionSeverity = 'low' | 'moderate' | 'high' | 'severe' | 'fatal';
export type SideEffectSeverity = 'mild' | 'moderate' | 'severe' | 'emergency';

// 1. Medication (Formulary)
export interface IMedication extends IAuditFields {
  name: string;
  genericName?: string;
  brand?: string;
  manufacturer?: string;
  categoryId: string; // Ref to MedicationCategory
  strength: string; // e.g. "500"
  unit: string; // e.g. "mg"
  form: MedicationForm;
  storageInstructions?: string;
  disposalInstructions?: string;
  requiresPrescription: boolean;
  isControlled: boolean;
  barcode?: string;
  qrCode?: string;
  isActive: boolean;
}

// 2. Category
export interface IMedicationCategory extends IAuditFields {
  name: string; // e.g. "Antibiotics"
  description?: string;
  colorCode?: string;
}

// 3. Prescription
export interface IPrescription extends IAuditFields {
  petId: string;
  ownerId: string;
  hospitalId?: string;
  doctorId?: string;
  diagnosisLinkageId?: string;
  medicalRecordId?: string;
  vaccinationRecordId?: string;
  status: PrescriptionStatus;
  issuedAt: Date;
  expiresAt?: Date;
  refillCount: number;
  refillsUsed: number;
  notes?: string;
}

// 4. Prescription Item
export interface IPrescriptionItem extends IAuditFields {
  prescriptionId: string;
  medicationId: string;
  dosage: string;
  route: MedicationRoute;
  frequencyRule: string; // Cron or simple rule
  schedule: IMedicationSchedule;
  durationDays: number;
  quantity: number;
  specialInstructions?: string;
}

export interface IMedicationSchedule {
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
  night: boolean;
  beforeFood: boolean;
  afterFood: boolean;
  everyXHours?: number;
  customCron?: string;
  weightBased?: boolean;
  ageBased?: boolean;
  conditionalRule?: string;
}

// 5. Medication Course
export interface IMedicationCourse extends IAuditFields {
  prescriptionItemId: string;
  petId: string;
  status: CourseStatus;
  startedAt: Date;
  completedAt?: Date;
  pausedAt?: Date;
  totalDosesExpected: number;
  dosesCompleted: number;
  dosesMissed: number;
  completionPercentage: number;
}

// 6. Medication Administration
export interface IMedicationAdministration extends IAuditFields {
  courseId: string;
  petId: string;
  medicationId: string;
  administeredAt: Date;
  scheduledAt: Date;
  status: AdministrationStatus;
  administeredBy: string; // userId
  doseGiven: string;
  notes?: string;
  reactionReported?: boolean;
  photoProofUrl?: string;
}

// 7. Medication Refill
export interface IMedicationRefill extends IAuditFields {
  prescriptionId: string;
  petId: string;
  requestedAt: Date;
  approvedAt?: Date;
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  notes?: string;
}

// 8. Medication Compliance
export interface IMedicationCompliance extends IAuditFields {
  petId: string;
  courseId: string;
  compliancePercentage: number;
  completedDoses: number;
  missedDoses: number;
  lateDoses: number;
  currentStreak: number;
  longestStreak: number;
  adherenceScore: number;
  lastCalculatedAt: Date;
}

// 9. Medication Interaction
export interface IMedicationInteraction extends IAuditFields {
  primaryMedicationId: string;
  interactingEntityId: string; // Can be another medication, a vaccine, or a disease
  entityType: 'medication' | 'vaccine' | 'disease' | 'food';
  severity: InteractionSeverity;
  description: string;
  recommendation: string;
  aiGenerated: boolean;
}

// 10. Medication Side Effect
export interface IMedicationSideEffect extends IAuditFields {
  petId: string;
  medicationId: string;
  administrationId?: string;
  observedSymptoms: string[];
  severity: SideEffectSeverity;
  onsetDateTime: Date;
  resolved: boolean;
  doctorNotes?: string;
  requiredEmergency: boolean;
  requiredHospitalization: boolean;
}

// 11. Medication Contraindication
export interface IMedicationContraindication extends IAuditFields {
  medicationId: string;
  conditionName: string;
  severity: InteractionSeverity;
  warningMessage: string;
}

// 12. Medication History
export interface IMedicationHistory extends IAuditFields {
  petId: string;
  medicationId: string;
  action: 'prescribed' | 'started' | 'paused' | 'stopped' | 'completed' | 'refilled';
  actionDate: Date;
  description: string;
}

// 13. Medication Inventory
export interface IMedicationInventory extends IAuditFields {
  medicationId: string;
  hospitalId: string;
  currentStock: number;
  minimumStock: number;
  batchNumber: string;
  expiryDate: Date;
}

// 14. Medication Template
export interface IMedicationTemplate extends IAuditFields {
  name: string;
  hospitalId?: string;
  medicationId: string;
  defaultDosage: string;
  defaultFrequency: string;
  defaultDurationDays: number;
  instructions: string;
}
