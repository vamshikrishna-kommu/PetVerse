import { medicalRecordRepository } from './repositories/medical-record.repository';
import { vitalLogRepository } from './repositories/vital-log.repository';
import { conditionRepository } from './repositories/condition.repository';
import { allergyRepository } from './repositories/allergy.repository';
import { prescriptionRepository } from '../medication/repositories/prescription.repository';
import { PrescriptionModel } from '../medication/models/prescription.model';
import { MedicationComplianceModel } from '../medication/models/course.model';
import { labReportRepository } from './repositories/lab-report.repository';
import { imagingStudyRepository } from './repositories/imaging-study.repository';
import { surgeryRepository } from './repositories/surgery.repository';
import { petRepository } from '../pets/pet.repository';
import { TimelineService } from '../pets/timeline.service';
import mongoose from 'mongoose';
import { vaccinationService } from '../vaccination/services/vaccination.service';
import { NotFoundError, ForbiddenError } from '../../shared/errors/AppError';
import { differenceInDays } from '../../shared/utils/dateUtils';
import type {
  IMedicalRecord,
  IVitalLog,
  ICondition,
  IAllergy,
  IPrescription,
  ILabReport,
  IImagingStudy,
  ISurgery,
  IHealthDashboard,
  IHealthScore,
  IHealthAlert,
  IHealthAnalytics,
  IHealthSummary,
  IConditionProgressNote,
} from '@petverse/shared-types';

// ─── Ownership guard ──────────────────────────────────────────
async function assertPetOwnership(
  petId: string,
  requestingUserId: string,
  isAdmin: boolean
): Promise<void> {
  const pet = await petRepository.findById(petId);
  if (!pet) throw new NotFoundError('Pet');
  if (!isAdmin && pet.ownerId.toString() !== requestingUserId) {
    throw new ForbiddenError('You do not own this pet');
  }
}

// ─── Health Score Calculation ─────────────────────────────────
async function calculateHealthScore(petId: string): Promise<IHealthScore> {
  const now = new Date();

  const [latestVital, conditions, emergencyAllergies, pendingFollowUps, pet] =
    await Promise.all([
      vitalLogRepository.findLatestByPet(petId),
      conditionRepository.findByPet(petId),
      allergyRepository.findEmergencyByPet(petId),
      medicalRecordRepository.findPendingFollowUps(petId),
      petRepository.findById(petId),
    ]);

  const activePrescriptions = await PrescriptionModel.find({ petId, status: 'active', isDeleted: { $ne: true } }).exec();
  const complianceRecords = await MedicationComplianceModel.find({ petId, isDeleted: { $ne: true } }).exec();

  let avgAdherence = 100;
  if (complianceRecords.length > 0) {
    const total = complianceRecords.reduce((sum: number, c: any) => sum + (c.adherenceScore || 100), 0);
    avgAdherence = Math.round(total / complianceRecords.length);
  }

  let vaccinationPenalty = 0;
  if (pet) {
    vaccinationPenalty = await vaccinationService.calculateVaccinationHealthImpact(petId, pet.species, pet.dob);
  }

  let vitalsScore = 10; // Default baseline if vitals exist
  let breakdown = {
    vitalsScore: 30,      // Max 30
    conditionsScore: 20, // Max 20
    medicationsScore: 20, // Max 20
    followUpScore: 20,    // Max 20
    allergyScore: 10,     // Max 10
  };

  // 1. Vitals Score (30%)
  if (latestVital) {
    const vitalAge = differenceInDays(now, new Date(latestVital.recordedAt));
    if (vitalAge <= 7) vitalsScore = 30;
    else if (vitalAge <= 14) vitalsScore = 25;
    else if (vitalAge <= 30) vitalsScore = 20;
    else vitalsScore = 10;
  } else {
    vitalsScore = 15; // Baseline if no vitals logged yet
  }
  breakdown.vitalsScore = vitalsScore;

  // 2. Active Conditions (20%)
  const activeConditions = conditions.filter(
    (c) => c.status === 'active' || c.status === 'monitoring' || c.status === 'recurring'
  );
  for (const cond of activeConditions) {
    if (cond.severity === 'critical') breakdown.conditionsScore -= 8;
    else if (cond.severity === 'severe') breakdown.conditionsScore -= 5;
    else if (cond.severity === 'moderate') breakdown.conditionsScore -= 3;
    else breakdown.conditionsScore -= 1;
  }
  breakdown.conditionsScore = Math.max(0, breakdown.conditionsScore);

  // 3. Medication Adherence (20%)
  if (activePrescriptions.length > 0) {
    if (avgAdherence < 80) {
      breakdown.medicationsScore = Math.max(0, Math.round(20 - ((80 - avgAdherence) * 0.5)));
    }
  }

  // 4. Follow-ups (20%)
  if (pendingFollowUps.length === 0) breakdown.followUpScore = 20;
  else if (pendingFollowUps.length === 1) breakdown.followUpScore = 10;
  else breakdown.followUpScore = 0;

  // 5. Emergency Allergies (10%)
  if (emergencyAllergies.length === 0) breakdown.allergyScore = 10;
  else breakdown.allergyScore = 0;

  const totalRaw = breakdown.vitalsScore + breakdown.conditionsScore + breakdown.medicationsScore + breakdown.followUpScore + breakdown.allergyScore;
  const score = Math.max(0, Math.min(100, totalRaw - vaccinationPenalty));

  const factors = [
    { factor: 'Vaccination Status', status: vaccinationPenalty === 0 ? 'Up to date' : 'Overdue due', impact: -vaccinationPenalty },
    { factor: 'Medication Adherence', status: `${avgAdherence}%`, score: breakdown.medicationsScore },
    { factor: 'Active Conditions', status: `${activeConditions.length} active`, score: breakdown.conditionsScore },
    { factor: 'Vital Signs Recency', status: latestVital ? `${differenceInDays(now, new Date(latestVital.recordedAt))}d ago` : 'No logs', score: breakdown.vitalsScore },
    { factor: 'Pending Follow-ups', status: `${pendingFollowUps.length} pending`, score: breakdown.followUpScore },
  ];

  return {
    score,
    breakdown,
    factors,
    trend: 'stable',
    lastCalculated: now.toISOString(),
  } as any;
}

// ─── Alert Builder ────────────────────────────────────────────
async function buildAlerts(petId: string): Promise<IHealthAlert[]> {
  const alerts: IHealthAlert[] = [];

  const [criticalConditions, emergencyAllergies, pendingFollowUps, abnormalLabs] =
    await Promise.all([
      conditionRepository.findActiveByPet(petId).then((conds) =>
        conds.filter((c) => c.severity === 'critical' || c.severity === 'severe')
      ),
      allergyRepository.findEmergencyByPet(petId),
      medicalRecordRepository.findPendingFollowUps(petId),
      labReportRepository.findAbnormal(petId, 3),
    ]);

  for (const cond of criticalConditions) {
    alerts.push({
      type: 'critical_condition',
      severity: cond.severity,
      title: `${cond.severity === 'critical' ? 'Critical' : 'Severe'} Condition: ${cond.name}`,
      description: `This condition requires immediate attention.`,
      entityId: (cond._id as { toString(): string }).toString(),
      entityType: 'condition',
    });
  }

  for (const allergy of emergencyAllergies) {
    alerts.push({
      type: 'emergency_allergy',
      severity: 'critical',
      title: `Emergency Allergy: ${allergy.allergen}`,
      description: `Anaphylactic reaction risk. ${allergy.avoidanceInstructions ?? ''}`,
      entityId: (allergy._id as { toString(): string }).toString(),
      entityType: 'allergy',
    });
  }

  for (const visit of pendingFollowUps) {
    alerts.push({
      type: 'overdue_followup',
      severity: 'moderate',
      title: 'Overdue Follow-up',
      description: `Follow-up from visit on ${visit.visitDate} is overdue.`,
      entityId: (visit._id as { toString(): string }).toString(),
      entityType: 'medical_record',
    });
  }

  for (const lab of abnormalLabs) {
    alerts.push({
      type: 'abnormal_lab',
      severity: 'moderate',
      title: `Abnormal Lab Results: ${lab.reportTitle}`,
      description: `${lab.abnormalCount} abnormal result${lab.abnormalCount > 1 ? 's' : ''} detected.`,
      entityId: (lab._id as { toString(): string }).toString(),
      entityType: 'lab_report',
    });
  }

  return alerts;
}

// ================================================================
// Health Service — Public API
// ================================================================
export const healthService = {

  // ─── Medical Records ─────────────────────────────────────────
  async getVisits(
    petId: string,
    requestingUserId: string,
    isAdmin: boolean,
    query: { status?: string; page?: number; limit?: number } = {}
  ): Promise<{ data: IMedicalRecord[]; total: number; page: number; limit: number }> {
    await assertPetOwnership(petId, requestingUserId, isAdmin);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;

    const { data, total } = await medicalRecordRepository.findByPet(petId, filter, { visitDate: -1 }, skip, limit);
    return {
      data: data.map((r) => r.toJSON() as unknown as IMedicalRecord),
      total,
      page,
      limit,
    };
  },

  async getVisitById(
    petId: string,
    recordId: string,
    requestingUserId: string,
    isAdmin: boolean
  ): Promise<IMedicalRecord> {
    await assertPetOwnership(petId, requestingUserId, isAdmin);
    const record = await medicalRecordRepository.findById(recordId);
    if (!record || record.petId.toString() !== petId) throw new NotFoundError('Medical record');
    return record.toJSON() as unknown as IMedicalRecord;
  },

  async createVisit(
    petId: string,
    requestingUserId: string,
    isAdmin: boolean,
    data: Partial<IMedicalRecord>
  ): Promise<IMedicalRecord> {
    await assertPetOwnership(petId, requestingUserId, isAdmin);
    const record = await medicalRecordRepository.create({
      ...data,
      petId: petId as unknown as import('mongoose').Types.ObjectId,
      ownerId: requestingUserId as unknown as import('mongoose').Types.ObjectId,
      createdBy: requestingUserId as unknown as import('mongoose').Types.ObjectId,
    } as any);
    const result = record.toJSON() as unknown as IMedicalRecord;

    await TimelineService.addEvent({
      petId,
      type: 'doctor_visit',
      title: `Vet Visit: ${data.visitReason ?? 'Checkup'}`,
      description: `${data.visitType ?? 'Visit'} at ${data.clinicName ?? 'clinic'}.`,
      metadata: { visitId: result._id, visitType: data.visitType, vetName: data.vetName },
    });

    return result;
  },

  async updateVisit(
    petId: string,
    recordId: string,
    requestingUserId: string,
    isAdmin: boolean,
    data: Partial<IMedicalRecord>
  ): Promise<IMedicalRecord> {
    await assertPetOwnership(petId, requestingUserId, isAdmin);
    const record = await medicalRecordRepository.findById(recordId);
    if (!record || record.petId.toString() !== petId) throw new NotFoundError('Medical record');

    const updated = await medicalRecordRepository.updateById(recordId, {
      ...data,
      updatedBy: requestingUserId,
    } as any);
    if (!updated) throw new NotFoundError('Medical record');
    return updated.toJSON() as unknown as IMedicalRecord;
  },

  async deleteVisit(
    petId: string,
    recordId: string,
    requestingUserId: string,
    isAdmin: boolean
  ): Promise<void> {
    await assertPetOwnership(petId, requestingUserId, isAdmin);
    const record = await medicalRecordRepository.findById(recordId);
    if (!record || record.petId.toString() !== petId) throw new NotFoundError('Medical record');
    await medicalRecordRepository.softDelete(recordId, requestingUserId);
  },

  // ─── Vitals ──────────────────────────────────────────────────
  async getVitals(
    petId: string,
    requestingUserId: string,
    isAdmin: boolean,
    query: { sinceDate?: string; limit?: number } = {}
  ): Promise<{ data: IVitalLog[]; total: number }> {
    await assertPetOwnership(petId, requestingUserId, isAdmin);
    const limit = query.limit ?? 50;
    const filter: Record<string, unknown> = {};
    if (query.sinceDate) filter.recordedAt = { $gte: query.sinceDate };

    const { data, total } = await vitalLogRepository.findByPet(petId, filter, { recordedAt: -1 }, 0, limit);
    return {
      data: data.map((v) => v.toJSON() as unknown as IVitalLog),
      total,
    };
  },

  async getLatestVitals(
    petId: string,
    requestingUserId: string,
    isAdmin: boolean
  ): Promise<IVitalLog | null> {
    await assertPetOwnership(petId, requestingUserId, isAdmin);
    const vital = await vitalLogRepository.findLatestByPet(petId);
    return vital ? (vital.toJSON() as unknown as IVitalLog) : null;
  },

  async logVital(
    petId: string,
    requestingUserId: string,
    isAdmin: boolean,
    data: Partial<IVitalLog>
  ): Promise<IVitalLog> {
    await assertPetOwnership(petId, requestingUserId, isAdmin);
    const log = await vitalLogRepository.create({
      ...data,
      petId: petId as unknown as import('mongoose').Types.ObjectId,
      ownerId: requestingUserId as unknown as import('mongoose').Types.ObjectId,
      createdBy: requestingUserId as unknown as import('mongoose').Types.ObjectId,
      recordedAt: data.recordedAt ?? new Date().toISOString(),
    } as any);
    const result = log.toJSON() as unknown as IVitalLog;

    if (data.weight !== undefined) {
      await TimelineService.addEvent({
        petId,
        type: 'vital_logged',
        title: 'Vitals Recorded',
        description: `Weight: ${data.weight} kg${data.temperature ? `, Temp: ${data.temperature}°C` : ''}`,
        metadata: { weight: data.weight, temperature: data.temperature, pulse: data.pulse },
      });
    }

    return result;
  },

  async deleteVital(
    petId: string,
    vitalId: string,
    requestingUserId: string,
    isAdmin: boolean
  ): Promise<void> {
    await assertPetOwnership(petId, requestingUserId, isAdmin);
    const vital = await vitalLogRepository.findById(vitalId);
    if (!vital || vital.petId.toString() !== petId) throw new NotFoundError('Vital log');
    await vitalLogRepository.deleteById(vitalId);
  },

  // ─── Conditions ──────────────────────────────────────────────
  async getConditions(
    petId: string,
    requestingUserId: string,
    isAdmin: boolean
  ): Promise<ICondition[]> {
    await assertPetOwnership(petId, requestingUserId, isAdmin);
    const conditions = await conditionRepository.findByPet(petId);
    return conditions.map((c) => c.toJSON() as unknown as ICondition);
  },

  async addCondition(
    petId: string,
    requestingUserId: string,
    isAdmin: boolean,
    data: Partial<ICondition>
  ): Promise<ICondition> {
    await assertPetOwnership(petId, requestingUserId, isAdmin);
    const condition = await conditionRepository.create({
      ...data,
      petId: petId as unknown as import('mongoose').Types.ObjectId,
      ownerId: requestingUserId as unknown as import('mongoose').Types.ObjectId,
      createdBy: requestingUserId as unknown as import('mongoose').Types.ObjectId,
    } as any);
    const result = condition.toJSON() as unknown as ICondition;

    await TimelineService.addEvent({
      petId,
      type: 'condition_added',
      title: `Condition Recorded: ${data.name}`,
      description: `${data.acuteOrChronic} | ${data.severity} severity`,
      metadata: { conditionId: result._id, severity: data.severity },
    });

    return result;
  },

  async updateCondition(
    petId: string,
    condId: string,
    requestingUserId: string,
    isAdmin: boolean,
    data: Partial<ICondition>
  ): Promise<ICondition> {
    await assertPetOwnership(petId, requestingUserId, isAdmin);
    const condition = await conditionRepository.findById(condId);
    if (!condition || condition.petId.toString() !== petId) throw new NotFoundError('Condition');

    const wasActive = condition.status === 'active';
    const updated = await conditionRepository.updateById(condId, {
      ...data,
      updatedBy: requestingUserId,
    } as any);
    if (!updated) throw new NotFoundError('Condition');

    if (wasActive && data.status === 'resolved') {
      await TimelineService.addEvent({
        petId,
        type: 'condition_resolved',
        title: `Condition Resolved: ${condition.name}`,
        description: `Marked as resolved.`,
        metadata: { conditionId: condId },
      });
    }

    return updated.toJSON() as unknown as ICondition;
  },

  async addProgressNote(
    petId: string,
    condId: string,
    requestingUserId: string,
    isAdmin: boolean,
    note: string
  ): Promise<ICondition> {
    await assertPetOwnership(petId, requestingUserId, isAdmin);
    const condition = await conditionRepository.findById(condId);
    if (!condition || condition.petId.toString() !== petId) throw new NotFoundError('Condition');

    const progressNote = {
      date: new Date().toISOString(),
      note,
      addedBy: requestingUserId,
    };

    const updated = await conditionRepository.updateById(condId, {
      $push: { progressionNotes: progressNote },
      updatedBy: requestingUserId,
    } as any);
    if (!updated) throw new NotFoundError('Condition');
    return updated.toJSON() as unknown as ICondition;
  },

  async deleteCondition(
    petId: string,
    condId: string,
    requestingUserId: string,
    isAdmin: boolean
  ): Promise<void> {
    await assertPetOwnership(petId, requestingUserId, isAdmin);
    const condition = await conditionRepository.findById(condId);
    if (!condition || condition.petId.toString() !== petId) throw new NotFoundError('Condition');
    await conditionRepository.softDelete(condId, requestingUserId);
  },

  // ─── Allergies ───────────────────────────────────────────────
  async getAllergies(
    petId: string,
    requestingUserId: string,
    isAdmin: boolean
  ): Promise<IAllergy[]> {
    await assertPetOwnership(petId, requestingUserId, isAdmin);
    const allergies = await allergyRepository.findByPet(petId);
    return allergies.map((a) => a.toJSON() as unknown as IAllergy);
  },

  async addAllergy(
    petId: string,
    requestingUserId: string,
    isAdmin: boolean,
    data: Partial<IAllergy>
  ): Promise<IAllergy> {
    await assertPetOwnership(petId, requestingUserId, isAdmin);
    const allergy = await allergyRepository.create({
      ...data,
      petId: petId as unknown as import('mongoose').Types.ObjectId,
      ownerId: requestingUserId as unknown as import('mongoose').Types.ObjectId,
      createdBy: requestingUserId as unknown as import('mongoose').Types.ObjectId,
    } as any);
    const result = allergy.toJSON() as unknown as IAllergy;

    await TimelineService.addEvent({
      petId,
      type: 'allergy_added',
      title: `Allergy Recorded: ${data.allergen}`,
      description: `${data.allergenType} allergy — ${data.severity} severity.${data.isEmergencyFlag ? ' ⚠️ Emergency risk.' : ''}`,
      metadata: { allergyId: result._id, severity: data.severity, isEmergency: data.isEmergencyFlag },
    });

    return result;
  },

  async updateAllergy(
    petId: string,
    allergyId: string,
    requestingUserId: string,
    isAdmin: boolean,
    data: Partial<IAllergy>
  ): Promise<IAllergy> {
    await assertPetOwnership(petId, requestingUserId, isAdmin);
    const allergy = await allergyRepository.findById(allergyId);
    if (!allergy || allergy.petId.toString() !== petId) throw new NotFoundError('Allergy');

    const updated = await allergyRepository.updateById(allergyId, {
      ...data,
      updatedBy: requestingUserId,
    } as any);
    if (!updated) throw new NotFoundError('Allergy');
    return updated.toJSON() as unknown as IAllergy;
  },

  async deleteAllergy(
    petId: string,
    allergyId: string,
    requestingUserId: string,
    isAdmin: boolean
  ): Promise<void> {
    await assertPetOwnership(petId, requestingUserId, isAdmin);
    const allergy = await allergyRepository.findById(allergyId);
    if (!allergy || allergy.petId.toString() !== petId) throw new NotFoundError('Allergy');
    await allergyRepository.softDelete(allergyId, requestingUserId);
  },



  // ─── Lab Reports ─────────────────────────────────────────────
  async getLabReports(
    petId: string,
    requestingUserId: string,
    isAdmin: boolean,
    query: { page?: number; limit?: number; category?: string } = {}
  ): Promise<{ data: ILabReport[]; total: number; page: number; limit: number }> {
    await assertPetOwnership(petId, requestingUserId, isAdmin);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = {};
    if (query.category) filter.category = query.category;

    const { data, total } = await labReportRepository.findByPet(petId, filter, skip, limit);
    return {
      data: data.map((r) => r.toJSON() as unknown as ILabReport),
      total,
      page,
      limit,
    };
  },

  async getLabReportById(
    petId: string,
    labId: string,
    requestingUserId: string,
    isAdmin: boolean
  ): Promise<ILabReport> {
    await assertPetOwnership(petId, requestingUserId, isAdmin);
    const report = await labReportRepository.findById(labId);
    if (!report || report.petId.toString() !== petId) throw new NotFoundError('Lab report');
    return report.toJSON() as unknown as ILabReport;
  },

  async createLabReport(
    petId: string,
    requestingUserId: string,
    isAdmin: boolean,
    data: Partial<ILabReport>
  ): Promise<ILabReport> {
    await assertPetOwnership(petId, requestingUserId, isAdmin);
    const abnormalCount = (data.results ?? []).filter((r) => r.isAbnormal).length;
    const report = await labReportRepository.create({
      ...data,
      abnormalCount,
      petId: petId as unknown as import('mongoose').Types.ObjectId,
      ownerId: requestingUserId as unknown as import('mongoose').Types.ObjectId,
      createdBy: requestingUserId as unknown as import('mongoose').Types.ObjectId,
    } as any);
    const result = report.toJSON() as unknown as ILabReport;

    await TimelineService.addEvent({
      petId,
      type: data.results && data.results.length > 0 ? 'lab_resulted' : 'lab_ordered',
      title: `Lab ${data.results && data.results.length > 0 ? 'Results' : 'Ordered'}: ${data.reportTitle}`,
      description: `${data.category} panel${abnormalCount > 0 ? ` — ${abnormalCount} abnormal result${abnormalCount > 1 ? 's' : ''}` : ''}`,
      metadata: { labId: result._id, category: data.category, abnormalCount },
    });

    return result;
  },

  async updateLabReport(
    petId: string,
    labId: string,
    requestingUserId: string,
    isAdmin: boolean,
    data: Partial<ILabReport>
  ): Promise<ILabReport> {
    await assertPetOwnership(petId, requestingUserId, isAdmin);
    const report = await labReportRepository.findById(labId);
    if (!report || report.petId.toString() !== petId) throw new NotFoundError('Lab report');

    const abnormalCount = data.results
      ? data.results.filter((r) => r.isAbnormal).length
      : report.abnormalCount;

    const updated = await labReportRepository.updateById(labId, {
      ...data,
      abnormalCount,
      updatedBy: requestingUserId,
    } as any);
    if (!updated) throw new NotFoundError('Lab report');
    return updated.toJSON() as unknown as ILabReport;
  },

  // ─── Imaging Studies ─────────────────────────────────────────
  async getImagingStudies(
    petId: string,
    requestingUserId: string,
    isAdmin: boolean,
    query: { page?: number; limit?: number } = {}
  ): Promise<{ data: IImagingStudy[]; total: number; page: number; limit: number }> {
    await assertPetOwnership(petId, requestingUserId, isAdmin);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const { data, total } = await imagingStudyRepository.findByPet(petId, skip, limit);
    return {
      data: data.map((s) => s.toJSON() as unknown as IImagingStudy),
      total,
      page,
      limit,
    };
  },

  async getImagingStudyById(
    petId: string,
    studyId: string,
    requestingUserId: string,
    isAdmin: boolean
  ): Promise<IImagingStudy> {
    await assertPetOwnership(petId, requestingUserId, isAdmin);
    const study = await imagingStudyRepository.findById(studyId);
    if (!study || study.petId.toString() !== petId) throw new NotFoundError('Imaging study');
    return study.toJSON() as unknown as IImagingStudy;
  },

  async createImagingStudy(
    petId: string,
    requestingUserId: string,
    isAdmin: boolean,
    data: Partial<IImagingStudy>
  ): Promise<IImagingStudy> {
    await assertPetOwnership(petId, requestingUserId, isAdmin);
    const study = await imagingStudyRepository.create({
      ...data,
      petId: petId as unknown as import('mongoose').Types.ObjectId,
      ownerId: requestingUserId as unknown as import('mongoose').Types.ObjectId,
      createdBy: requestingUserId as unknown as import('mongoose').Types.ObjectId,
    } as any);
    const result = study.toJSON() as unknown as IImagingStudy;

    const hasImages = (data.images?.length ?? 0) > 0;
    await TimelineService.addEvent({
      petId,
      type: hasImages ? 'imaging_performed' : 'imaging_ordered',
      title: `${data.studyType?.toUpperCase() ?? 'Imaging'} ${hasImages ? 'Performed' : 'Ordered'}: ${data.bodyRegion}`,
      description: `Study type: ${data.studyType}`,
      metadata: { studyId: result._id, studyType: data.studyType, bodyRegion: data.bodyRegion },
    });

    return result;
  },

  async updateImagingStudy(
    petId: string,
    studyId: string,
    requestingUserId: string,
    isAdmin: boolean,
    data: Partial<IImagingStudy>
  ): Promise<IImagingStudy> {
    await assertPetOwnership(petId, requestingUserId, isAdmin);
    const study = await imagingStudyRepository.findById(studyId);
    if (!study || study.petId.toString() !== petId) throw new NotFoundError('Imaging study');

    const updated = await imagingStudyRepository.updateById(studyId, {
      ...data,
      updatedBy: requestingUserId,
    } as any);
    if (!updated) throw new NotFoundError('Imaging study');
    return updated.toJSON() as unknown as IImagingStudy;
  },

  // ─── Surgeries ───────────────────────────────────────────────
  async getSurgeries(
    petId: string,
    requestingUserId: string,
    isAdmin: boolean
  ): Promise<ISurgery[]> {
    await assertPetOwnership(petId, requestingUserId, isAdmin);
    const surgeries = await surgeryRepository.findByPet(petId);
    return surgeries.map((s) => s.toJSON() as unknown as ISurgery);
  },

  async createSurgery(
    petId: string,
    requestingUserId: string,
    isAdmin: boolean,
    data: Partial<ISurgery>
  ): Promise<ISurgery> {
    await assertPetOwnership(petId, requestingUserId, isAdmin);
    const surgery = await surgeryRepository.create({
      ...data,
      petId: petId as unknown as import('mongoose').Types.ObjectId,
      ownerId: requestingUserId as unknown as import('mongoose').Types.ObjectId,
      createdBy: requestingUserId as unknown as import('mongoose').Types.ObjectId,
    } as any);
    const result = surgery.toJSON() as unknown as ISurgery;

    await TimelineService.addEvent({
      petId,
      type: 'surgery_performed',
      title: `Surgery: ${data.procedureName}`,
      description: `Surgeon: ${data.surgeonName ?? 'N/A'} | Clinic: ${data.clinicName ?? 'N/A'}`,
      metadata: { surgeryId: result._id, outcome: data.outcome },
    });

    return result;
  },

  async updateSurgery(
    petId: string,
    surgeryId: string,
    requestingUserId: string,
    isAdmin: boolean,
    data: Partial<ISurgery>
  ): Promise<ISurgery> {
    await assertPetOwnership(petId, requestingUserId, isAdmin);
    const surgery = await surgeryRepository.findById(surgeryId);
    if (!surgery || surgery.petId.toString() !== petId) throw new NotFoundError('Surgery');

    const wasRecovering = surgery.recoveryStatus === 'recovering';
    const updated = await surgeryRepository.updateById(surgeryId, {
      ...data,
      updatedBy: requestingUserId,
    } as any);
    if (!updated) throw new NotFoundError('Surgery');

    if (wasRecovering && data.recoveryStatus === 'recovered') {
      await TimelineService.addEvent({
        petId,
        type: 'surgery_recovered',
        title: `Recovery Complete: ${surgery.procedureName}`,
        description: 'Marked as fully recovered.',
        metadata: { surgeryId },
      });
    }

    return updated.toJSON() as unknown as ISurgery;
  },

  async deleteSurgery(
    petId: string,
    surgeryId: string,
    requestingUserId: string,
    isAdmin: boolean
  ): Promise<void> {
    await assertPetOwnership(petId, requestingUserId, isAdmin);
    const surgery = await surgeryRepository.findById(surgeryId);
    if (!surgery || surgery.petId.toString() !== petId) throw new NotFoundError('Surgery');
    await surgeryRepository.softDelete(surgeryId, requestingUserId);
  },

  // ─── Dashboard & Analytics ───────────────────────────────────
  async getHealthDashboard(
    petId: string,
    requestingUserId: string,
    isAdmin: boolean
  ): Promise<IHealthDashboard> {
    await assertPetOwnership(petId, requestingUserId, isAdmin);

    const [
      healthScore,
      alerts,
      activeConditions,
      activeMedications,
      pendingFollowUps,
      latestVitals,
      weightTrend,
      recentVisitsData,
    ] = await Promise.all([
      calculateHealthScore(petId),
      buildAlerts(petId),
      conditionRepository.findActiveByPet(petId),
      prescriptionRepository.findActiveByPet(petId),
      medicalRecordRepository.findPendingFollowUps(petId),
      vitalLogRepository.findLatestByPet(petId),
      vitalLogRepository.findWeightTrend(petId, 12),
      medicalRecordRepository.findByPet(petId, { status: 'active' }, { visitDate: -1 }, 0, 5),
    ]);

    const emergencyAlertsCount = alerts.filter(
      (a) => a.type === 'critical_condition' || a.type === 'emergency_allergy'
    ).length;

    return {
      petId,
      healthScore,
      activeConditionsCount: activeConditions.length,
      activeMedicationsCount: activeMedications.length,
      pendingFollowUpsCount: pendingFollowUps.length,
      emergencyAlertsCount,
      alerts,
      recentVisits: recentVisitsData.data.map((r) => r.toJSON() as unknown as IMedicalRecord),
      activeMedications: activeMedications.map((rx: any) => {
        const endDate = rx.expiresAt || rx.endDate ? new Date(rx.expiresAt || rx.endDate) : null;
        let daysRemaining;
        if (endDate) {
          const diff = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 3600 * 24));
          daysRemaining = diff > 0 ? diff : 0;
        }
        return {
          name: rx.medicationName || 'Prescription',
          dosage: rx.dosage || '',
          frequency: rx.frequency || '',
          daysRemaining
        };
      }),
      activeConditions: activeConditions.map((r) => r.toJSON() as unknown as ICondition),
      latestVitals: latestVitals ? (latestVitals.toJSON() as unknown as IVitalLog) : null,
      weightTrend,
    };
  },

  async getHealthAnalytics(
    petId: string,
    requestingUserId: string,
    isAdmin: boolean,
    periodDays = 365
  ): Promise<IHealthAnalytics> {
    await assertPetOwnership(petId, requestingUserId, isAdmin);

    const from = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString();
    const to = new Date().toISOString();

    const [allVisits, weightProgress, temperatureTrend, conditions, activeMeds] =
      await Promise.all([
        medicalRecordRepository.findByPet(petId, {}, { visitDate: 1 }, 0, 1000),
        vitalLogRepository.findWeightTrend(petId, 50),
        vitalLogRepository.findTrend(petId, 'temperature', 50),
        conditionRepository.findByPet(petId),
        prescriptionRepository.findByPet(petId),
      ]);

    // Visits per month bucketing
    const monthMap = new Map<string, number>();
    for (const visit of allVisits.data) {
      if (visit.visitDate >= from) {
        const month = visit.visitDate.substring(0, 7); // YYYY-MM
        monthMap.set(month, (monthMap.get(month) ?? 0) + 1);
      }
    }
    const visitsPerMonth = Array.from(monthMap.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Conditions by category
    const catMap = new Map<string, number>();
    for (const cond of conditions) {
      const cat = cond.category ?? 'Uncategorized';
      catMap.set(cat, (catMap.get(cat) ?? 0) + 1);
    }
    const conditionsByCategory = Array.from(catMap.entries()).map(([category, count]) => ({ category, count }));

    // Medication usage (active days)
    const medicationUsage = activeMeds.map((rx) => {
      const start = new Date(rx.issuedAt);
      const end = rx.expiresAt ? new Date(rx.expiresAt) : new Date();
      return {
        name: 'Prescription',
        daysActive: Math.max(0, differenceInDays(end, start)),
      };
    });

    // Active conditions over time (simplified: current count per month from conditions added)
    const condOverTimeMap = new Map<string, number>();
    for (const cond of conditions) {
      if (cond.diagnosedDate && cond.diagnosedDate >= from) {
        const month = cond.diagnosedDate.substring(0, 7);
        condOverTimeMap.set(month, (condOverTimeMap.get(month) ?? 0) + 1);
      }
    }
    const activeConditionsOverTime = Array.from(condOverTimeMap.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      petId,
      period: { from, to },
      visitsPerMonth,
      conditionsByCategory,
      medicationUsage,
      weightProgress,
      temperatureTrend: temperatureTrend.map((t) => ({ date: t.date, temperature: t.value })),
      labTrends: [], // future: aggregate from LabReport results
      activeConditionsOverTime,
    };
  },

  async getHealthSummary(
    petId: string,
    requestingUserId: string,
    isAdmin: boolean
  ): Promise<IHealthSummary> {
    await assertPetOwnership(petId, requestingUserId, isAdmin);

    const pet = await petRepository.findById(petId);
    if (!pet) throw new NotFoundError('Pet');

    const [activeConditions, activeMedications, allergies, latestVitals, recentVisitsData] =
      await Promise.all([
        conditionRepository.findActiveByPet(petId),
        prescriptionRepository.findActiveByPet(petId),
        allergyRepository.findByPet(petId),
        vitalLogRepository.findLatestByPet(petId),
        medicalRecordRepository.findByPet(petId, {}, { visitDate: -1 }, 0, 5),
      ]);

    const ageYears = pet.dob
      ? Math.floor(differenceInDays(new Date(), new Date(pet.dob)) / 365)
      : undefined;

    return {
      petId,
      generatedAt: new Date().toISOString(),
      petProfile: {
        species: pet.species,
        breed: pet.breed,
        ageYears,
        weightKg: latestVitals?.weight ?? pet.weight,
        gender: pet.gender,
      },
      activeConditions: activeConditions.map((c) => ({
        name: c.name,
        severity: c.severity,
        durationDays: c.onsetDate ? differenceInDays(new Date(), new Date(c.onsetDate)) : 0,
        status: c.status,
      })),
      activeMedications: activeMedications.map((rx) => ({
        name: 'Prescription',
        dosage: 'See Rx',
        frequency: 'See Rx',
        daysRemaining: rx.expiresAt
          ? Math.max(0, differenceInDays(new Date(rx.expiresAt), new Date()))
          : undefined,
      })),
      allergies: allergies.map((a) => ({
        allergen: a.allergen,
        severity: a.severity,
        isEmergency: a.isEmergencyFlag,
      })),
      recentVitals: latestVitals ? (latestVitals.toJSON() as unknown as IVitalLog) : {},
      recentVisits: recentVisitsData.data.map((v) => ({
        date: v.visitDate,
        reason: v.visitReason,
        assessment: v.soap?.assessment,
        plan: v.soap?.plan,
        vetName: v.vetName,
      })),
      labTrends: [],
      openFollowUps: recentVisitsData.data
        .filter((v) => v.followUpDate && new Date(v.followUpDate) >= new Date())
        .map((v) => ({
          dueDate: v.followUpDate!,
          notes: v.followUpNotes,
          visitId: (v._id as { toString(): string }).toString(),
        })),
    };
  },
};
