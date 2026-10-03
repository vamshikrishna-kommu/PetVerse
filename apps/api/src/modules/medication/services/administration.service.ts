import { administrationRepository, sideEffectRepository } from '../repositories';
import { courseComplianceService } from './course-compliance.service';
import { TimelineService } from '../../pets/timeline.service';
import type { IMedicationAdministration, IMedicationSideEffect } from '@petverse/shared-types';

export class AdministrationService {
  async logAdministration(petId: string, courseId: string, data: Partial<IMedicationAdministration>, userId: string) {
    const admin = await administrationRepository.create({
      ...data,
      petId,
      courseId,
      administeredBy: userId,
      administeredAt: data.administeredAt || new Date(),
    });

    // Update compliance engine asynchronously
    if (data.status) {
      await courseComplianceService.updateCompliance(courseId, petId, data.status as any);
    }

    // Emit Timeline Event
    await TimelineService.addEvent({
      petId,
      type: 'medicine_given',
      title: `Medication ${data.status}`,
      description: `Dose logged as ${data.status}.`,
      metadata: { administrationId: admin._id.toString(), courseId }
    });

    return admin;
  }

  async reportSideEffect(petId: string, data: Partial<IMedicationSideEffect>, userId: string) {
    const effect = await sideEffectRepository.create({
      ...data,
      petId,
      createdBy: userId,
      onsetDateTime: data.onsetDateTime || new Date(),
    });

    // Emit Timeline Event
    await TimelineService.addEvent({
      petId,
      type: 'side_effect_reported' as any, // Will need to map
      title: `Side Effect: ${data.severity}`,
      description: `Adverse reaction reported.`,
      metadata: { sideEffectId: effect._id.toString() }
    });

    return effect;
  }
}

export const administrationService = new AdministrationService();
