import { reminderRepository } from '../repositories/reminder.repository';
import { eventBus } from '../../events/services/event-bus.service';
import { DomainEventType, IReminder } from '@petverse/shared-types';
import { logger } from '../../../shared/utils/logger';
import { getNextCronTrigger } from '../utils/cron.utils';

export class ReminderService {
  private workerInterval: NodeJS.Timeout | null = null;
  private isProcessing = false;

  public startWorker() {
    // Run every 30 seconds
    this.workerInterval = setInterval(() => this.processDueReminders(), 30000);
    logger.info('ReminderService worker started.');
  }

  public stopWorker() {
    if (this.workerInterval) clearInterval(this.workerInterval);
  }

  public async processDueReminders() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const now = new Date().toISOString();
      const dueReminders = await reminderRepository.findDueReminders(now);

      if (dueReminders.length > 0) {
        logger.info(`[Reminder Worker] Found ${dueReminders.length} due reminders.`);
      }

      for (const reminder of dueReminders) {
        await this.triggerReminder(reminder);
      }
    } catch (error) {
      logger.error('Error in Reminder Worker:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  public calculateNextTrigger(reminder: IReminder): { nextTrigger: string; deactivate: boolean } {
    if (reminder.frequency === 'once') {
      return { nextTrigger: '2099-12-31T23:59:59.000Z', deactivate: true };
    }

    // Escalation retry interval check:
    // If the reminder has an escalation policy with retryIntervalMinutes and hasn't yet hit maxRetries,
    // schedule the next retry sooner (retryIntervalMinutes).
    const maxRetries = reminder.escalation?.maxRetries ?? 0;
    const retryIntervalMinutes = reminder.escalation?.retryIntervalMinutes ?? 0;
    if (maxRetries > 0 && retryIntervalMinutes > 0 && (reminder.missedCount || 0) < maxRetries) {
      const retryTime = new Date(Date.now() + retryIntervalMinutes * 60 * 1000);
      return { nextTrigger: retryTime.toISOString(), deactivate: false };
    }

    // Custom frequency with cron expression
    if (reminder.frequency === 'custom' && reminder.cronExpression) {
      const nextCron = getNextCronTrigger(reminder.cronExpression, new Date());
      if (nextCron) {
        return { nextTrigger: nextCron.toISOString(), deactivate: false };
      }
    }

    const current = new Date(reminder.nextTrigger);
    const base = isNaN(current.getTime()) ? new Date() : current;

    switch (reminder.frequency) {
      case 'daily':
        base.setDate(base.getDate() + 1);
        break;
      case 'weekly':
        base.setDate(base.getDate() + 7);
        break;
      case 'monthly':
        base.setMonth(base.getMonth() + 1);
        break;
      case 'custom':
      default:
        base.setDate(base.getDate() + 1);
        break;
    }

    return { nextTrigger: base.toISOString(), deactivate: false };
  }

  public async triggerReminder(reminder: IReminder) {
    try {
      // Check escalation state:
      const maxRetries = reminder.escalation?.maxRetries ?? 0;
      const missedCount = reminder.missedCount || 0;
      const isEscalated = maxRetries > 0 && missedCount >= maxRetries;

      let priority = reminder.priority;
      let channels = [...(reminder.notificationChannels || ['in-app', 'push'])];
      let title = reminder.title;
      let message = reminder.message;

      if (isEscalated) {
        priority = reminder.escalation?.emergencyEscalation ? 'emergency' : 'critical';
        if (!channels.includes('email')) channels.push('email');
        if (!channels.includes('sms')) channels.push('sms');
        title = `[URGENT REMINDER] ${reminder.title}`;
        message = reminder.message
          ? `[ESCALATED - ${missedCount} MISSED] ${reminder.message}`
          : `This reminder has been missed ${missedCount} times and requires immediate attention.`;

        // If emergency escalation, publish DomainEventType.EmergencyTriggered as well
        if (reminder.escalation?.emergencyEscalation) {
          await eventBus.publish(
            reminder._id.toString(),
            'ReminderEscalation',
            DomainEventType.EmergencyTriggered,
            {
              ownerId: reminder.ownerId,
              petId: reminder.petId,
              title: `Emergency: Reminder Escalated - ${reminder.title}`,
              reason: `Reminder for ${reminder.title} exceeded ${maxRetries} missed occurrences.`,
              priority: 'emergency',
            },
            { source: 'reminder-engine' }
          );
        }
      }

      // 1. Publish Domain Event (Notification Engine will catch this)
      await eventBus.publish(
        reminder._id.toString(),
        'Reminder',
        DomainEventType.ReminderTriggered,
        {
          ownerId: reminder.ownerId,
          petId: reminder.petId,
          type: reminder.type,
          title,
          message,
          priority,
          notificationChannels: channels,
          linkedEntityId: reminder.linkedEntityId,
          isEscalated,
          missedCount,
        },
        { source: 'reminder-engine' }
      );

      // 2. Calculate next trigger time based on frequency & escalation policy
      const { nextTrigger, deactivate } = this.calculateNextTrigger(reminder);

      if (deactivate) {
        await reminderRepository.markCompleted(reminder._id.toString());
      } else {
        await reminderRepository.incrementMissedCount(reminder._id.toString(), nextTrigger);
      }

    } catch (error) {
      logger.error(`Error triggering reminder ${reminder._id}:`, error);
    }
  }
}

export const reminderService = new ReminderService();
