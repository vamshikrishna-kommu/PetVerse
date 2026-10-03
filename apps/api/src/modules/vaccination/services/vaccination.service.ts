import { vaccinationRecordRepository } from '../repositories/vaccination-record.repository';
import { vaccinationReactionRepository } from '../repositories/vaccination-reaction.repository';
import { vaccineScheduleService } from './vaccine-schedule.service';
import { TimelineService } from '../../pets/timeline.service';
import { eventBus } from '../../events/services/event-bus.service';
import { petRepository } from '../../pets/pet.repository';
import { NotFoundError, ForbiddenError } from '../../../shared/errors/AppError';
import { DomainEventType } from '@petverse/shared-types';
import type { IVaccinationRecordDocument } from '../models/vaccination-record.model';
import type { IVaccinationReactionDocument } from '../models/vaccination-reaction.model';

export class VaccinationService {
  
  async recordVaccination(
    petId: string, 
    userId: string, 
    data: any
  ): Promise<IVaccinationRecordDocument> {
    const pet = await petRepository.findById(petId);
    if (!pet) {
      throw new NotFoundError('Pet');
    }
    if (pet.ownerId.toString() !== userId) {
      throw new ForbiddenError('You do not own this pet');
    }

    const record = await vaccinationRecordRepository.create({
      petId: petId as any,
      ownerId: userId as any,
      vaccineId: data.vaccineId,
      status: data.status || 'in_progress',
      currentDoseNumber: data.currentDoseNumber || 1,
      doses: data.doses || [],
      certificateIds: [],
      notes: data.notes,
      createdBy: userId as any,
    });
    
    // Timeline Integration
    await TimelineService.addEvent({
      petId,
      type: 'vaccine_administered',
      title: 'Vaccine Administered',
      description: `A vaccine was recorded.`,
      metadata: { recordId: record._id.toString() }
    });

    // Publish domain event
    await eventBus.publish(
      record._id.toString(),
      'VaccinationRecord',
      data.status === 'completed' ? DomainEventType.VaccinationCompleted : DomainEventType.VaccinationScheduled,
      {
        recordId: record._id.toString(),
        petId,
        vaccineId: data.vaccineId,
        status: data.status || 'in_progress',
      },
      {},
      userId
    );
    
    return record;
  }
  
  async recordReaction(
    petId: string,
    userId: string,
    data: any
  ): Promise<IVaccinationReactionDocument> {
    const pet = await petRepository.findById(petId);
    if (!pet) {
      throw new NotFoundError('Pet');
    }
    if (pet.ownerId.toString() !== userId) {
      throw new ForbiddenError('You do not own this pet');
    }

    const reaction = await vaccinationReactionRepository.create({
      petId: petId as any,
      vaccinationRecordId: data.vaccinationRecordId,
      doseId: data.doseId,
      severity: data.severity,
      symptoms: data.symptoms,
      onsetDateTime: data.onsetDateTime,
      vetEvaluated: data.vetEvaluated,
      vetNotes: data.vetNotes,
      medicationGiven: data.medicationGiven,
      hospitalizationRequired: data.hospitalizationRequired,
      createdBy: userId as any,
    });
    
    // Timeline Integration
    await TimelineService.addEvent({
      petId,
      type: 'vaccine_reaction',
      title: 'Vaccine Reaction Reported',
      description: `A ${data.severity} reaction was reported.`,
      metadata: { reactionId: reaction._id.toString(), severity: data.severity }
    });
    
    return reaction;
  }
  
  async getSchedule(petId: string, species: string, dob?: string) {
    return vaccineScheduleService.generatePetSchedule(petId, species, dob);
  }
  
  // To be called when generating health score
  async calculateVaccinationHealthImpact(petId: string, species: string, dob?: string): Promise<number> {
    const schedule = await this.getSchedule(petId, species, dob);
    const overdueCount = schedule.upcomingVaccines.filter(v => v.isOverdue).length;
    
    // Simple penalty logic for the health score
    let penalty = 0;
    if (overdueCount > 0) {
      penalty += overdueCount * 10; // 10 points off per overdue vaccine
    }
    return Math.min(penalty, 40); // Max 40 points penalty
  }
}

export const vaccinationService = new VaccinationService();
