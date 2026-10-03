import { eventBus } from '../../events/services/event-bus.service';
import { DomainEventType, IEvent, ReminderType, ReminderFrequency, PriorityLevel } from '@petverse/shared-types';
import { reminderRepository } from '../repositories/reminder.repository';
import { logger } from '../../../shared/utils/logger';
import { UserModel } from '../../users/user.model';

export class ReminderSubscriber {
  public init() {
    eventBus.subscribe(DomainEventType.MedicationStarted, this.handleMedicationStarted.bind(this));
    eventBus.subscribe(DomainEventType.VaccinationScheduled, this.handleVaccinationScheduled.bind(this));
    logger.info('ReminderSubscriber initialized: Translating domain events into Reminders.');
  }

  private async handleMedicationStarted(event: IEvent<any>) {
    const { petId, ownerId, courseId, medicationName, instructions, nextDoseAt } = event.payload;

    // Deterministic idempotency key: same event → same key → no duplicate reminder
    const idempotencyKey = `${event.eventId}::medication::${petId}`;

    const user = await UserModel.findById(ownerId).select('timezone').lean();
    const userTimezone = (user as any)?.timezone || 'UTC';

    const { created } = await reminderRepository.createIfNotExists({
      idempotencyKey,
      ownerId,
      petId,
      type: 'medication' as ReminderType,
      title: `Medication Due: ${medicationName}`,
      message: instructions || 'Time for medication',
      frequency: 'daily' as ReminderFrequency,
      timezone: userTimezone,
      nextTrigger: nextDoseAt || new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      isActive: true,
      missedCount: 0,
      completedCount: 0,
      escalation: {
        maxRetries: 3,
        retryIntervalMinutes: 30,
        notifySecondaryOwner: true,
        emergencyEscalation: false,
      },
      notificationChannels: ['in-app', 'push'],
      priority: 'high' as PriorityLevel,
      linkedEntityId: courseId,
    });

    if (created) {
      logger.info(`[ReminderSubscriber] Created medication reminder for pet ${petId}`);
    } else {
      logger.info(`[ReminderSubscriber] Duplicate medication reminder skipped (idempotency) for pet ${petId}`);
    }
  }

  private async handleVaccinationScheduled(event: IEvent<any>) {
    const { petId, ownerId, vaccineName, scheduledDate, recordId } = event.payload;

    // Deterministic idempotency key
    const idempotencyKey = `${event.eventId}::vaccination::${petId}`;

    const { created } = await reminderRepository.createIfNotExists({
      idempotencyKey,
      ownerId,
      petId,
      type: 'vaccination' as ReminderType,
      title: `Upcoming Vaccination: ${vaccineName}`,
      message: 'Please visit the clinic for this scheduled vaccination.',
      frequency: 'once' as ReminderFrequency,
      timezone: 'UTC',
      nextTrigger: scheduledDate,
      isActive: true,
      missedCount: 0,
      completedCount: 0,
      escalation: {
        maxRetries: 1,
        retryIntervalMinutes: 1440,
        notifySecondaryOwner: false,
        emergencyEscalation: false,
      },
      notificationChannels: ['email', 'in-app'],
      priority: 'medium' as PriorityLevel,
      linkedEntityId: recordId,
    });

    if (created) {
      logger.info(`[ReminderSubscriber] Created vaccination reminder for pet ${petId}`);
    } else {
      logger.info(`[ReminderSubscriber] Duplicate vaccination reminder skipped (idempotency) for pet ${petId}`);
    }
  }
}

export const reminderSubscriber = new ReminderSubscriber();
