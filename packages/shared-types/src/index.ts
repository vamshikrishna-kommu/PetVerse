// ============================================================
// PetVerse — Shared TypeScript Types & Interfaces
// Used by both apps/web and apps/api
// ============================================================
// ─── Common ──────────────────────────────────────────────────
import type { IPrescription } from './medication.types';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  data?: T;
  meta?: PaginatedResult<T>['meta'];
  error?: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

// ─── Enums ───────────────────────────────────────────────────
export type UserRole = 'pet_owner' | 'vet' | 'shelter' | 'admin';

export type PetSpecies =
  | 'dog'
  | 'cat'
  | 'bird'
  | 'rabbit'
  | 'fish'
  | 'reptile'
  | 'other';

export type PetGender = 'male' | 'female' | 'unknown';

export type MedicalRecordType =
  | 'diagnosis'
  | 'surgery'
  | 'checkup'
  | 'lab'
  | 'prescription'
  | 'other';

export type VaccinationStatus = 'upcoming' | 'completed' | 'overdue' | 'skipped' | 'cancelled' | 'exempted';
export type VaccineCategory = 'core' | 'non_core' | 'lifestyle' | 'travel';
export type DoseType = 'primary' | 'booster' | 'annual' | 'catch_up';
export type ReactionSeverity = 'none' | 'mild' | 'moderate' | 'severe' | 'emergency';
export type VaccineRoute = 'subcutaneous' | 'intramuscular' | 'intranasal' | 'oral';

export type ReminderFrequency = 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';

export type ReminderType =
  | 'medication'
  | 'vaccination'
  | 'appointment'
  | 'grooming'
  | 'checkup'
  | 'other';

export type AppointmentType =
  | 'checkup'
  | 'vaccination'
  | 'surgery'
  | 'grooming'
  | 'consultation';

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type LostFoundType = 'lost' | 'found';
export type LostFoundStatus = 'active' | 'resolved' | 'expired';

export type AdoptionStatus = 'available' | 'pending' | 'adopted';

export type ProductCategory =
  | 'food'
  | 'pharmacy'
  | 'toys'
  | 'accessories'
  | 'grooming'
  | 'bedding'
  | 'health'
  | 'medicine'
  | 'other';

export type OrderStatus =
  | 'payment_pending'
  | 'pending'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type ExpenseCategory =
  | 'veterinary'
  | 'medication'
  | 'vaccination'
  | 'food'
  | 'grooming'
  | 'accessories'
  | 'insurance'
  | 'emergency'
  | 'other'
  | 'vet'
  | 'medicine'
  | 'toys';

export type NotificationType =
  | 'reminder'
  | 'appointment'
  | 'community'
  | 'system'
  | 'emergency';

export type ReviewTargetType = 'vet' | 'clinic' | 'product' | 'shelter';

// ─── Timeline Event Types ─────────────────────────────────────
export type TimelineEventType =
  // Pet lifecycle events
  | 'created'
  | 'vaccinated'
  | 'doctor_visit'
  | 'medicine_started'
  | 'weight_updated'
  | 'birthday'
  | 'adopted'
  | 'lost'
  | 'found'
  | 'appointment'
  | 'medical_report_added'
  | 'qr_generated'
  // Health management events
  | 'diagnosis_added'
  | 'diagnosis_resolved'
  | 'prescription_started'
  | 'prescription_completed'
  | 'prescription_discontinued'
  | 'medicine_given'
  | 'course_completed'
  | 'side_effect_reported'
  | 'lab_ordered'
  | 'lab_resulted'
  | 'imaging_ordered'
  | 'imaging_performed'
  | 'surgery_performed'
  | 'surgery_recovered'
  | 'condition_added'
  | 'condition_resolved'
  | 'vital_logged'
  | 'allergy_added'
  | 'followup_due'
  | 'followup_completed'
  // Vaccination events
  | 'vaccine_scheduled'
  | 'vaccine_administered'
  | 'vaccine_overdue'
  | 'vaccine_reaction'
  | 'vaccine_certificate_generated';

// ─── Health — Severity & Status Types ────────────────────────
export type HealthSeverity = 'mild' | 'moderate' | 'severe' | 'critical';

export type ConditionStatus = 'active' | 'resolved' | 'monitoring' | 'recurring';

export type AllergyType = 'medication' | 'food' | 'environmental' | 'contact';

export type AllergySeverity = 'mild' | 'moderate' | 'severe' | 'anaphylactic';

export type PrescriptionStatus = 'active' | 'completed' | 'discontinued' | 'on_hold';

export type MedicationRoute =
  | 'oral'
  | 'topical'
  | 'injectable'
  | 'inhaled'
  | 'ophthalmic'
  | 'otic'
  | 'rectal'
  | 'other';

export type LabCategory =
  | 'blood'
  | 'urine'
  | 'biochemistry'
  | 'hormones'
  | 'microbiology'
  | 'parasitology'
  | 'other';

export type LabResultStatus = 'normal' | 'high' | 'low' | 'critical_high' | 'critical_low';

export type ImagingType = 'xray' | 'mri' | 'ct' | 'ultrasound' | 'ecg' | 'other';

export type StudyStatus = 'ordered' | 'performed' | 'interpreted' | 'reviewed';

export type LabReportStatus = 'ordered' | 'collected' | 'processing' | 'resulted' | 'reviewed';

export type SurgeryOutcome = 'successful' | 'complicated' | 'incomplete';

export type RecoveryStatus = 'recovering' | 'recovered' | 'complications';

export type VisitType =
  | 'routine_checkup'
  | 'sick_visit'
  | 'follow_up'
  | 'emergency'
  | 'vaccination'
  | 'surgery'
  | 'dental'
  | 'dermatology'
  | 'specialist'
  | 'telemedicine'
  | 'other';

export type VisitStatus = 'draft' | 'active' | 'archived';

export type HydrationStatus = 'normal' | 'mild_dehydration' | 'moderate_dehydration' | 'severe_dehydration';

export interface IUserPreferences {
  notifications?: {
    email?: boolean;
    push?: boolean;
    appointmentReminders?: boolean;
    vaccinationReminders?: boolean;
    medicationReminders?: boolean;
    healthAlerts?: boolean;
    marketing?: boolean;
  };
  privacy?: {
    publicPetProfile?: boolean;
    qrVisibility?: boolean;
    locationSharing?: boolean;
    contactPreference?: 'in_app' | 'email' | 'none';
  };
  appearance?: {
    theme?: 'light' | 'dark' | 'system';
    units?: 'metric' | 'imperial';
  };
}

// ─── User ────────────────────────────────────────────────────
export interface IUser {
  _id: string;
  email: string;
  phone?: string;
  role: UserRole;
  profile: {
    firstName: string;
    lastName: string;
    avatar?: string;
    bio?: string;
    location?: {
      type: 'Point';
      coordinates: [number, number]; // [lng, lat]
    };
  };
  preferences?: IUserPreferences;
  isVerified: boolean;
  isActive: boolean;
  fcmToken?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IAuthTokens {
  accessToken: string;
  expiresIn: number;
}

// ─── Pet ─────────────────────────────────────────────────────
export interface IPet {
  _id: string;
  ownerId: string;
  
  // Basic Information
  name: string;
  nickname?: string;
  species: PetSpecies;
  breed?: string;
  subBreed?: string;
  gender: PetGender;
  dob?: string;
  estimatedAge?: string;
  color?: string;
  weight?: number; // in kg
  height?: number; // in cm
  bloodGroup?: string;

  // Identity
  microchipId?: string;
  qrCode: string;
  registrationNumber?: string;
  passportNumber?: string;

  // Media
  avatar?: string;
  gallery: string[];

  // Health
  allergies: string[];
  chronicDiseases: string[];
  disabilities: string[];
  currentMedications: string[];
  isVaccinated: boolean;
  isSterilized: boolean;

  // Lifestyle
  lifestyle: 'indoor' | 'outdoor' | 'mixed';
  activityLevel: 'low' | 'moderate' | 'high';
  favoriteFood: string[];
  favoriteToys: string[];
  behaviorNotes?: string;

  // Ownership
  adoptionDate?: string;
  shelterName?: string;
  insuranceProvider?: string;
  insuranceExpiry?: string;

  // System
  isAdopted: boolean;
  isLost: boolean;
  isPublicProfile: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Timeline Events ─────────────────────────────────────────
export interface IPetTimelineEvent {
  _id: string;
  petId: string;
  type: TimelineEventType;
  title: string;
  description?: string;
  date: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// ─── Audit Fields (shared by all health entities) ────────────
export interface IAuditFields {
  createdBy: string;       // userId
  updatedBy?: string;      // userId
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Attachment ──────────────────────────────────────────────
export type AttachmentEntityType =
  | 'medical_record'
  | 'lab_report'
  | 'imaging'
  | 'surgery'
  | 'prescription';

export interface IAttachmentFile extends IAuditFields {
  _id: string;
  petId: string;
  entityType: AttachmentEntityType;
  entityId: string;
  url: string;
  publicId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: string;
  version: number;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Medical Record (Visit) ───────────────────────────────────
export interface ISOAPNote {
  subjective?: string;   // Patient history, symptoms as reported by owner
  objective?: string;    // Physical exam findings, vitals
  assessment?: string;   // Clinical diagnosis / differential
  plan?: string;         // Treatment plan, prescriptions, follow-up
}

export interface IMedicalRecord extends IAuditFields {
  _id: string;
  petId: string;
  ownerId: string;

  // Visit information
  visitType: VisitType;
  visitDate: string;
  visitReason: string;
  chiefComplaint?: string;
  symptoms: string[];

  // Clinical
  soap: ISOAPNote;
  physicalExam?: string;
  doctorNotes?: string;

  // Clinic & Vet
  vetName?: string;
  vetLicenseNumber?: string;
  clinicName?: string;
  clinicAddress?: string;

  // Status & Follow-up
  status: VisitStatus;
  followUpDate?: string;
  followUpNotes?: string;

  // Linked entities (IDs)
  attachments: string[];

  // Audit
  createdBy: string;
  updatedBy?: string;
  version: number;
  isDeleted: boolean;

  // AI compatibility
  aiMetadata?: Record<string, unknown>;

  createdAt: string;
  updatedAt: string;
}

// ─── Vital Log ───────────────────────────────────────────────
export interface IBloodPressure {
  systolic: number;
  diastolic: number;
}

export interface IVitalLog extends Pick<IAuditFields, 'createdBy' | 'createdAt' | 'updatedAt' | 'isDeleted' | 'deletedAt'> {
  _id: string;
  petId: string;
  ownerId: string;

  recordedAt: string;
  recordedBy: 'owner' | 'vet';

  // Measurements (all optional — log what you have)
  weight?: number;           // kg
  height?: number;           // cm
  temperature?: number;      // °C
  pulse?: number;            // bpm
  respiratoryRate?: number;  // breaths/min
  bloodPressure?: IBloodPressure;
  oxygenSaturation?: number; // %
  bodyConditionScore?: number; // 1-9 Purina scale
  painScore?: number;        // 0-10 numeric scale
  hydration?: HydrationStatus;

  notes?: string;
  linkedVisitId?: string;

  // AI compatibility
  aiMetadata?: Record<string, unknown>;

  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Condition ───────────────────────────────────────────────
export interface IConditionProgressNote {
  date: string;
  note: string;
  addedBy: string;
}

export interface ICondition extends IAuditFields {
  _id: string;
  petId: string;
  ownerId: string;

  name: string;
  icdCode?: string;
  category?: string;
  bodySystem?: string;

  acuteOrChronic: 'acute' | 'chronic';
  severity: HealthSeverity;
  status: ConditionStatus;

  onsetDate?: string;
  diagnosedDate?: string;
  resolvedDate?: string;
  diagnosedByVet?: string;

  progressionNotes: IConditionProgressNote[];
  treatments: string[];

  isEmergencyFlag: boolean;

  // AI compatibility
  aiMetadata?: Record<string, unknown>;

  createdBy: string;
  updatedBy?: string;
  version: number;
  isDeleted: boolean;

  createdAt: string;
  updatedAt: string;
}

// ─── Allergy ─────────────────────────────────────────────────
export interface IAllergy extends IAuditFields {
  _id: string;
  petId: string;
  ownerId: string;

  allergenType: AllergyType;
  allergen: string;
  severity: AllergySeverity;
  reaction: string;
  symptoms: string[];

  isEmergencyFlag: boolean;

  firstObservedDate?: string;
  confirmedByVet: boolean;
  confirmedByVetName?: string;

  managementPlan?: string;
  avoidanceInstructions?: string;

  // AI compatibility
  aiMetadata?: Record<string, unknown>;

  createdBy: string;
  updatedBy?: string;
  isDeleted: boolean;

  createdAt: string;
  updatedAt: string;
}

// Removed legacy IPrescription and IMedicationSchedule (Now in medication.types.ts)

// ─── Lab Report ──────────────────────────────────────────────
export interface ILabResult {
  testName: string;
  value: string | number;
  unit?: string;
  referenceRange?: { min?: number; max?: number; text?: string };
  status: LabResultStatus;
  isAbnormal: boolean;
  notes?: string;
}

export interface ILabReport extends IAuditFields {
  _id: string;
  petId: string;
  ownerId: string;

  category: LabCategory;
  reportTitle: string;
  orderedBy?: string;
  performedAt?: string;
  collectedDate?: string;
  resultDate?: string;

  status: LabReportStatus;
  results: ILabResult[];

  vetInterpretation?: string;
  abnormalCount: number;

  attachments: string[];
  linkedVisitId?: string;

  // AI compatibility
  aiMetadata?: Record<string, unknown>;

  createdBy: string;
  updatedBy?: string;
  version: number;
  isDeleted: boolean;

  createdAt: string;
  updatedAt: string;
}

// ─── Imaging Study ───────────────────────────────────────────
export interface IImagingImage {
  url: string;
  publicId: string;
  thumbnailUrl?: string;
  label?: string;
}

export interface IImagingStudy extends IAuditFields {
  _id: string;
  petId: string;
  ownerId: string;

  studyType: ImagingType;
  bodyRegion: string;
  orderedBy?: string;
  performedDate?: string;

  images: IImagingImage[];

  status: StudyStatus;
  vetInterpretation?: string;
  impression?: string;
  recommendations?: string;

  comparedWithStudyId?: string;
  linkedVisitId?: string;

  // AI compatibility
  aiMetadata?: Record<string, unknown>;

  createdBy: string;
  updatedBy?: string;
  version: number;
  isDeleted: boolean;

  createdAt: string;
  updatedAt: string;
}

// ─── Surgery ─────────────────────────────────────────────────
export interface ISurgery extends IAuditFields {
  _id: string;
  petId: string;
  ownerId: string;

  procedureName: string;
  procedureCode?: string;

  surgeonName?: string;
  clinicName?: string;

  scheduledDate?: string;
  performedDate?: string;
  durationMinutes?: number;

  anesthesiaType?: string;
  anesthesiologist?: string;

  complications: string[];
  outcome?: SurgeryOutcome;

  recoveryStatus?: RecoveryStatus;
  recoveryNotes?: string;
  restrictions: string[];

  followUpDate?: string;
  linkedVisitId?: string;

  // AI compatibility
  aiMetadata?: Record<string, unknown>;

  createdBy: string;
  updatedBy?: string;
  version: number;
  isDeleted: boolean;

  createdAt: string;
  updatedAt: string;
}

// ─── Health Analytics ─────────────────────────────────────────
export interface IHealthScore {
  score: number;         // 0-100
  breakdown: {
    vitalsScore: number;
    conditionsScore: number;
    medicationsScore: number;
    followUpScore: number;
    allergyScore: number;
  };
  trend: 'improving' | 'stable' | 'declining';
  lastCalculated: string;
}

export interface IHealthAlert {
  type: 'critical_condition' | 'emergency_allergy' | 'overdue_followup' | 'overdue_medication' | 'abnormal_lab';
  severity: HealthSeverity;
  title: string;
  description: string;
  entityId: string;
  entityType: string;
}

export interface IHealthDashboard {
  petId: string;
  healthScore: IHealthScore;
  activeConditionsCount: number;
  activeMedicationsCount: number;
  pendingFollowUpsCount: number;
  emergencyAlertsCount: number;
  alerts: IHealthAlert[];
  recentVisits: IMedicalRecord[];
  activeMedications: Array<{ name: string; dosage: string; frequency: string; daysRemaining?: number }>;
  activeConditions: ICondition[];
  latestVitals: IVitalLog | null;
  weightTrend: Array<{ date: string; weight: number }>;
}

export interface IHealthAnalytics {
  petId: string;
  period: { from: string; to: string };
  visitsPerMonth: Array<{ month: string; count: number }>;
  conditionsByCategory: Array<{ category: string; count: number }>;
  medicationUsage: Array<{ name: string; daysActive: number }>;
  weightProgress: Array<{ date: string; weight: number }>;
  temperatureTrend: Array<{ date: string; temperature: number }>;
  labTrends: Array<{ testName: string; values: Array<{ date: string; value: number }> }>;
  activeConditionsOverTime: Array<{ month: string; count: number }>;
}

// AI-ready structured health summary
export interface IHealthSummary {
  petId: string;
  generatedAt: string;
  petProfile: {
    species: PetSpecies;
    breed?: string;
    ageYears?: number;
    weightKg?: number;
    gender: PetGender;
  };
  activeConditions: Array<{ name: string; severity: HealthSeverity; durationDays: number; status: ConditionStatus }>;
  activeMedications: Array<{ name: string; dosage: string; frequency: string; daysRemaining?: number }>;
  allergies: Array<{ allergen: string; severity: AllergySeverity; isEmergency: boolean }>;
  recentVitals: Partial<IVitalLog>;
  recentVisits: Array<{
    date: string;
    reason: string;
    assessment?: string;
    plan?: string;
    vetName?: string;
  }>;
  labTrends: Array<{ testName: string; latestValue: string | number; unit?: string; status: LabResultStatus }>;
  openFollowUps: Array<{ dueDate: string; notes?: string; visitId: string }>;
}

// ─── Legacy types kept for backward compatibility ─────────────
export interface IAttachment {
  url: string;
  publicId: string;
  type: string;
}

// ─── Vaccination (Enterprise) ──────────────────────────────────
export interface IVaccineDefinition extends Pick<IAuditFields, 'createdBy' | 'createdAt' | 'updatedAt' | 'isDeleted'> {
  _id: string;
  name: string;           // e.g., "Rabies"
  scientificName: string; // e.g., "Rabies Lyssavirus"
  category: VaccineCategory;
  species: PetSpecies[];
  description?: string;
  diseasePrevention: string[]; // e.g., ["Rabies"]
  defaultSchedule: {
    primaryDoses: number;
    intervalDays: number; // Days between primary doses
    boosterFrequencyMonths: number;
    minAgeWeeks: number;
  };
  isActive: boolean;
}

export interface IVaccinationDose {
  _id?: string;
  doseNumber: number;
  doseType: DoseType;
  dueDate: string;
  administeredDate?: string;
  status: VaccinationStatus;
  administeredBy?: string;     // Vet ID
  clinicName?: string;
  batchNumber?: string;
  manufacturer?: string;
  brand?: string;
  route?: VaccineRoute;
  injectionSite?: string;
  reactionId?: string;         // Link to reaction if occurred
  notes?: string;
}

export interface IVaccinationRecord extends IAuditFields {
  _id: string;
  petId: string;
  ownerId: string;
  vaccineId: string;           // Ref to IVaccineDefinition
  
  // Aggregate status for the series
  status: 'in_progress' | 'completed' | 'expired';
  currentDoseNumber: number;
  
  // The actual doses in this series
  doses: IVaccinationDose[];
  
  // Certificates linked to this series
  certificateIds: string[];
  
  // Expiration of the protection
  validUntil?: string;
  
  notes?: string;
  aiMetadata?: Record<string, unknown>;
}

export interface IVaccinationReaction extends IAuditFields {
  _id: string;
  petId: string;
  vaccinationRecordId: string;
  doseId: string; // Inside the record
  
  severity: ReactionSeverity;
  symptoms: string[];
  onsetDateTime: string;
  recoveryDateTime?: string;
  
  vetEvaluated: boolean;
  vetNotes?: string;
  medicationGiven?: string[];
  hospitalizationRequired: boolean;
}

export interface IVaccinationCertificate extends IAuditFields {
  _id: string;
  petId: string;
  vaccinationRecordIds: string[]; // The vaccines covered in this cert
  
  certificateNumber: string;
  issuedDate: string;
  validUntilDate?: string;
  
  issuedByVetId?: string;
  issuedByClinicName: string;
  
  qrCodeUrl: string;
  verificationUrl: string;
  pdfUrl?: string;
  digitalSignature?: string;
  
  status: 'active' | 'revoked' | 'expired';
}

export interface IVaccinationSchedule {
  petId: string;
  species: PetSpecies;
  upcomingVaccines: Array<{
    vaccineId: string;
    vaccineName: string;
    doseType: DoseType;
    dueDate: string;
    isOverdue: boolean;
    daysUntilDue: number;
  }>;
  completedVaccines: Array<{
    vaccineId: string;
    vaccineName: string;
    date: string;
  }>;
  lastCalculated: string;
}

// ─── Reminder ────────────────────────────────────────────────
export interface IReminderEscalation {
  maxRetries: number;
  retryIntervalMinutes: number;
  notifySecondaryOwner: boolean;
  emergencyEscalation: boolean;
}

export interface IReminder {
  _id: string;
  ownerId: string;
  petId: string;
  type: ReminderType;
  title: string;
  message?: string;
  
  // Schedule
  frequency: ReminderFrequency;
  cronExpression?: string;
  timezone: string;
  nextTrigger: string;
  validUntil?: string; // Expiration
  
  // State
  isActive: boolean;
  snoozedUntil?: string;
  missedCount: number;
  completedCount: number;
  
  // Escalation & Config
  escalation: IReminderEscalation;
  notificationChannels: NotificationChannel[];
  priority: PriorityLevel;
  
  linkedEntityId?: string; // Generic linkage to Prescription/Vaccine/Appt
  
  createdAt: string;
  updatedAt: string;
}

// ─── Appointment ─────────────────────────────────────────────
export interface IAppointment {
  _id: string;
  petId: string;
  ownerId: string;
  vetId?: string;
  clinicId?: string;
  appointmentDate?: string;
  startTime?: string;
  endTime?: string;
  cancellationReason?: string;
  scheduledAt: string;
  duration: number;
  type: AppointmentType;
  status: AppointmentStatus;
  notes?: string;
  fee?: number;
  paymentStatus?: 'pending' | 'paid' | 'refunded';
  meetLink?: string;
  linkedVisitId?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Growth ──────────────────────────────────────────────────
export interface IGrowthLog {
  _id: string;
  petId: string;
  date: string;
  weight?: number;
  height?: number;
  length?: number;
  notes?: string;
  photo?: string;
}

// ─── Lost & Found ────────────────────────────────────────────
export interface ILostFound {
  _id: string;
  reporterId: string;
  petId?: string;
  type: LostFoundType;
  status: LostFoundStatus;
  title: string;
  description: string;
  photos: string[];
  lastSeenLocation: {
    type: 'Point';
    coordinates: [number, number];
    address?: string;
  };
  lastSeenDate: string;
  contactInfo: { phone?: string; email?: string };
  reward?: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Expenses ────────────────────────────────────────────────
export interface IExpense {
  _id: string;
  userId: string;
  petId?: string;
  petName?: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  date: string;
  clinicName?: string;
  notes?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IExpenseAnalytics {
  totalSpending: number;
  monthlySpending: number;
  yearlySpending: number;
  byCategory: { category: ExpenseCategory; amount: number; percentage: number }[];
  byPet: { petId?: string; petName: string; amount: number }[];
  trend: { month: string; amount: number }[];
}

// ─── Community ───────────────────────────────────────────────
export interface ICommunityPost {
  _id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  petId?: string;
  petName?: string;
  petSpecies?: string;
  title: string;
  content: string;
  images: string[];
  tags: string[];
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  isPinned?: boolean;
  status: 'published' | 'hidden' | 'flagged';
  createdAt: string;
  updatedAt: string;
}

export interface ICommunityComment {
  _id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Marketplace ─────────────────────────────────────────────
export interface IProduct {
  _id: string;
  name: string;
  description: string;
  category: ProductCategory;
  price: number;
  currency: string;
  stock: number;
  images: string[];
  rating: number;
  reviewsCount: number;
  petSpecies: PetSpecies[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IOrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface IOrder {
  _id: string;
  userId: string;
  items: IOrderItem[];
  totalAmount: number;
  currency: string;
  status: OrderStatus;
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentId?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Adoption ────────────────────────────────────────────────
export interface IAdoptionListing {
  _id: string;
  shelterId: string;
  shelterName: string;
  shelterContact: string;
  name: string;
  species: PetSpecies;
  breed?: string;
  age: string;
  gender: PetGender;
  size: 'small' | 'medium' | 'large' | 'giant';
  description: string;
  photos: string[];
  isVaccinated: boolean;
  isSpayedNeutered: boolean;
  specialNeeds?: string;
  location: string;
  status: AdoptionStatus;
  createdAt: string;
  updatedAt: string;
}

export interface IAdoptionApplication {
  _id: string;
  listingId: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  homeType: 'apartment' | 'house_with_yard' | 'house_no_yard';
  hasOtherPets: boolean;
  otherPetsDetails?: string;
  experienceDescription: string;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Review ──────────────────────────────────────────────────
export interface IReview {
  _id: string;
  reviewerId: string;
  reviewer?: Pick<IUser, '_id' | 'profile'>;
  targetId: string;
  targetType: ReviewTargetType;
  rating: number;
  title: string;
  body: string;
  images: string[];
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Notification ────────────────────────────────────────────
export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical' | 'emergency';
export type DeliveryStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'clicked' | 'dismissed' | 'failed' | 'retrying' | 'dead_letter';
export type NotificationChannel = 'push' | 'email' | 'sms' | 'in-app' | 'silent';

export interface INotificationDelivery {
  channel: NotificationChannel;
  status: DeliveryStatus;
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  error?: string;
  retryCount: number;
  deadLetterReason?: string;
  nextRetryAt?: string;
}

export interface INotification {
  _id: string;
  userId: string;
  type: NotificationType;
  priority: PriorityLevel;
  title: string;
  body: string;
  data?: Record<string, unknown>; // E.g., route to open, petId, etc.
  deliveries: INotificationDelivery[];
  isRead: boolean; // Computed or master flag for in-app
  readAt?: string;
  isDeadLetter?: boolean;
  createdAt: string;
  expiresAt?: string; // Auto-delete if unread after X days
}

// ─── Clinic ──────────────────────────────────────────────────
export interface IClinic {
  _id: string;
  name: string;
  ownerId: string;
  type?: string;
  address: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  phone?: string;
  email?: string;
  website?: string;
  services: string[];
  openingHours: Record<string, { open: string; close: string }>;
  photos: string[];
  ratings: { avg: number; count: number };
  isVerified: boolean;
  emergencyAvailable?: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── AI ──────────────────────────────────────────────────────
export interface IBreedPrediction {
  breed: string;
  confidence: number;
  topBreeds: Array<{ breed: string; confidence: number }>;
}

export interface IHealthRiskAnalysis {
  riskLevel: 'low' | 'moderate' | 'high';
  conditions: Array<{ name: string; probability: number; description: string }>;
  recommendations: string[];
}

export interface IDietRecommendation {
  dailyCalories: number;
  proteinPercent: number;
  fatPercent: number;
  carbPercent: number;
  recommendedFoods: string[];
  avoidFoods: string[];
  notes: string;
}

export interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export * from './medication.types';
export * from './events.types';
export * from './automation.types';


