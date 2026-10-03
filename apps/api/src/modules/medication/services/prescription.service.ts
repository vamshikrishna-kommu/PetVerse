import { prescriptionRepository, prescriptionItemRepository, courseRepository } from '../repositories';
import { reminderRepository } from '../../reminders/repositories/reminder.repository';
import { TimelineService } from '../../pets/timeline.service';
import { eventBus } from '../../events/services/event-bus.service';
import { DomainEventType } from '@petverse/shared-types';
import type { IPrescription, IPrescriptionItem } from '@petverse/shared-types';
import mongoose from 'mongoose';

export class PrescriptionService {
  async createPrescription(
    data: Partial<IPrescription>, 
    itemsData: Partial<IPrescriptionItem>[], 
    userId: string
  ) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Create the master prescription
      const prescription = await prescriptionRepository.create({
        ...data,
        status: 'active',
        issuedAt: new Date(),
        createdBy: userId,
      });

      // 2. Create items
      const itemsToCreate = itemsData.map(item => ({
        ...item,
        prescriptionId: prescription._id.toString(),
        createdBy: userId,
      }));
      
      const items = await prescriptionItemRepository.createMany(itemsToCreate);

      // 3. For every item, initialize a Medication Course and a Medication Reminder
      for (const item of items) {
        const totalDosesExpected = this.calculateExpectedDoses(item);
        const course = await courseRepository.create({
          prescriptionItemId: item._id.toString(),
          petId: prescription.petId,
          status: 'started',
          startedAt: new Date(),
          totalDosesExpected,
          dosesCompleted: 0,
          dosesMissed: 0,
          completionPercentage: 0,
          createdBy: userId,
        });

        // Auto-create initial reminder for medication schedule
        await reminderRepository.create({
          ownerId: userId,
          petId: prescription.petId,
          type: 'medication',
          title: `Take ${item.medicationId || 'Medication'}`,
          message: `Dosage: ${item.dosage || 'As prescribed'}. ${(item as any).instructions || ''}`,
          frequency: 'daily',
          timezone: 'UTC',
          nextTrigger: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          priority: 'high',
          isActive: true,
          linkedEntityId: course._id.toString(),
          notificationChannels: ['in-app', 'push'],
        });
      }

      // 4. Emit to Timeline
      await TimelineService.addEvent({
        petId: prescription.petId,
        type: 'prescription_started',
        title: 'New Prescription Issued',
        description: `A new prescription with ${items.length} medication(s) was issued.`,
        metadata: { prescriptionId: prescription._id.toString() }
      });

      await session.commitTransaction();

      // 5. Publish domain event to system eventBus
      await eventBus.publish(
        prescription._id.toString(),
        'Prescription',
        DomainEventType.MedicationStarted,
        {
          prescriptionId: prescription._id.toString(),
          petId: prescription.petId,
          itemCount: items.length,
        },
        {},
        userId
      );

      return prescription;
    } catch (error: any) {
      const isTransactionUnsupported =
        error?.codeName === 'IllegalOperation' ||
        error?.message?.includes('Transaction') ||
        error?.code === 263;

      if (!isTransactionUnsupported) {
        await session.abortTransaction();
        throw error;
      }

      // Standalone MongoDB fallback without transactions
      const prescription = await prescriptionRepository.create({
        ...data,
        status: 'active',
        issuedAt: new Date(),
        createdBy: userId,
      });

      const itemsToCreate = itemsData.map(item => ({
        ...item,
        prescriptionId: prescription._id.toString(),
        createdBy: userId,
      }));
      
      const items = await prescriptionItemRepository.createMany(itemsToCreate);

      for (const item of items) {
        const totalDosesExpected = this.calculateExpectedDoses(item);
        await courseRepository.create({
          prescriptionItemId: item._id.toString(),
          petId: prescription.petId,
          status: 'started',
          startedAt: new Date(),
          totalDosesExpected,
          dosesCompleted: 0,
          dosesMissed: 0,
          completionPercentage: 0,
          createdBy: userId,
        });

        await reminderRepository.create({
          ownerId: userId,
          petId: prescription.petId,
          type: 'medication',
          title: `Take ${item.medicationId || 'Medication'}`,
          message: `Dosage: ${item.dosage || 'As prescribed'}. ${(item as any).instructions || ''}`,
          frequency: 'daily',
          timezone: 'UTC',
          nextTrigger: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          priority: 'high',
          notificationChannels: ['in-app', 'push'],
          linkedEntityId: prescription._id.toString(),
        });
      }

      await TimelineService.addEvent({
        petId: prescription.petId,
        type: 'medicine_started',
        title: 'Medication Started',
        description: `Prescribed ${items.length} items.`,
        metadata: { prescriptionId: prescription._id.toString() }
      });

      return prescription;
    } finally {
      session.endSession();
    }
  }

  private calculateExpectedDoses(item: Partial<IPrescriptionItem>): number {
    // A simplified expected dose calculator.
    // In a real scenario, this would parse the `frequencyRule` or `schedule`.
    if (!item.durationDays || !item.schedule) return 0;
    
    let dailyDoses = 0;
    if (item.schedule.morning) dailyDoses++;
    if (item.schedule.afternoon) dailyDoses++;
    if (item.schedule.evening) dailyDoses++;
    if (item.schedule.night) dailyDoses++;
    if (item.schedule.everyXHours) {
      dailyDoses += Math.floor(24 / item.schedule.everyXHours);
    }
    
    return dailyDoses * item.durationDays;
  }
}

export const prescriptionService = new PrescriptionService();
