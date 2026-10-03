import type { IAuditFields } from './index';

export enum DomainEventType {
  // Pets
  PetCreated = 'PET_CREATED',
  PetUpdated = 'PET_UPDATED',
  PetDeleted = 'PET_DELETED',
  PetFound = 'PET_FOUND',
  LostPetReported = 'LOST_PET_REPORTED',
  
  // Health & Records
  MedicalRecordCreated = 'MEDICAL_RECORD_CREATED',
  MedicalRecordUpdated = 'MEDICAL_RECORD_UPDATED',
  DiagnosisAdded = 'DIAGNOSIS_ADDED',
  HealthScoreChanged = 'HEALTH_SCORE_CHANGED',
  GrowthRecorded = 'GROWTH_RECORDED',
  
  // Medications
  PrescriptionCreated = 'PRESCRIPTION_CREATED',
  MedicationStarted = 'MEDICATION_STARTED',
  MedicationCompleted = 'MEDICATION_COMPLETED',
  DoseScheduled = 'DOSE_SCHEDULED',
  DoseMissed = 'DOSE_MISSED',
  DoseCompleted = 'DOSE_COMPLETED',
  
  // Vaccinations
  VaccinationScheduled = 'VACCINATION_SCHEDULED',
  VaccinationCompleted = 'VACCINATION_COMPLETED',
  VaccinationOverdue = 'VACCINATION_OVERDUE',
  
  // Appointments & Reminders
  AppointmentBooked = 'APPOINTMENT_BOOKED',
  AppointmentRescheduled = 'APPOINTMENT_RESCHEDULED',
  AppointmentCancelled = 'APPOINTMENT_CANCELLED',
  ReminderTriggered = 'REMINDER_TRIGGERED',
  ReminderCompleted = 'REMINDER_COMPLETED',
  
  // System & Users
  NotificationSent = 'NOTIFICATION_SENT',
  UserRegistered = 'USER_REGISTERED',
  UserVerified = 'USER_VERIFIED',
  LoginSuccess = 'LOGIN_SUCCESS',
  EmergencyTriggered = 'EMERGENCY_TRIGGERED',
  
  // Community & Commerce
  AdoptionRequested = 'ADOPTION_REQUESTED',
  OrderPlaced = 'ORDER_PLACED',
  ExpenseAdded = 'EXPENSE_ADDED',
  CommunityPostCreated = 'COMMUNITY_POST_CREATED',
}

export enum EventStatus {
  Pending = 'pending',
  Processed = 'processed',
  Failed = 'failed',
  Ignored = 'ignored'
}

export interface IEventMetadata {
  version: number;
  timestamp: string;
  correlationId?: string; // Links related events together
  causationId?: string;   // The ID of the event that caused this event
  replayFlag: boolean;
  source?: string;        // E.g., 'medication-service', 'user-controller'
  userId?: string;        // The user who triggered the original action
}

export interface IEvent<T = Record<string, any>> {
  eventId: string;
  aggregateId: string;    // E.g., Pet ID, User ID, Prescription ID
  aggregateType: string;  // E.g., 'Pet', 'User', 'Prescription'
  eventType: DomainEventType;
  payload: T;
  metadata: IEventMetadata;
}

export interface IEventDocument extends Omit<IEvent, 'eventId'>, IAuditFields {
  _id: string;
  status: EventStatus;
  processingError?: string;
}
