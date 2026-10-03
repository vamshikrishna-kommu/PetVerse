import mongoose from 'mongoose';
import { ReminderService } from '../services/reminder.service';
import { reminderRepository } from '../repositories/reminder.repository';
import { ReminderModel } from '../models/reminder.model';
import { eventBus } from '../../events/services/event-bus.service';
import { DomainEventType } from '@petverse/shared-types';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/petverse_test';

describe('Reminder Worker and Scheduler Unit Tests', () => {
  jest.setTimeout(30000);

  const ownerId = new mongoose.Types.ObjectId().toString();
  const petId = new mongoose.Types.ObjectId().toString();
  const reminderService = new ReminderService();

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }
  });

  afterAll(async () => {
    await ReminderModel.deleteMany({ ownerId });
    reminderService.stopWorker();
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe('1. Reminder Creation with Escalation and Custom Cron', () => {
    it('creates a reminder with multi-tier escalation parameters and cron expression', async () => {
      const reminder = await reminderRepository.create({
        ownerId,
        petId,
        type: 'medication',
        title: 'Heartworm Preventive',
        message: 'Give 1 chewable tablet with meal',
        frequency: 'monthly',
        cronExpression: '0 9 1 * *',
        nextTrigger: new Date(Date.now() - 60000).toISOString(), // Due 1 minute ago
        priority: 'high',
        notificationChannels: ['in-app', 'push'],
        escalation: {
          maxRetries: 3,
          retryIntervalMinutes: 15,
          emergencyEscalation: false,
          notifySecondaryOwner: true,
        },
      });

      expect(reminder).toBeDefined();
      expect(reminder.title).toBe('Heartworm Preventive');
      expect(reminder.cronExpression).toBe('0 9 1 * *');
      expect(reminder.escalation?.maxRetries).toBe(3);
      expect(reminder.escalation?.notifySecondaryOwner).toBe(true);
    });
  });

  describe('2. Snooze Functionality', () => {
    it('snoozes a reminder by pushing nextTrigger into the future', async () => {
      const reminder = await reminderRepository.create({
        ownerId,
        petId,
        type: 'vaccination',
        title: 'Rabies Booster Reminder',
        message: 'Annual rabies vaccine due',
        frequency: 'once',
        nextTrigger: new Date(Date.now() + 3600000).toISOString(),
        priority: 'medium',
      });

      const snoozedTime = new Date(Date.now() + 4 * 3600000).toISOString(); // +4h
      const snoozed = await reminderRepository.snooze(reminder._id.toString(), snoozedTime);

      expect(snoozed).not.toBeNull();
      expect(new Date(snoozed!.snoozedUntil!).getTime()).toBe(new Date(snoozedTime).getTime());
    });
  });

  describe('3. Due Reminders Query & Worker Execution', () => {
    it('queries due reminders and triggers domain events and reschedule', async () => {
      const pastDate = new Date(Date.now() - 120000).toISOString();
      const dueReminder = await reminderRepository.create({
        ownerId,
        petId,
        type: 'checkup',
        title: 'Dental Exam',
        message: 'Visit clinic for cleaning',
        frequency: 'daily',
        nextTrigger: pastDate,
        priority: 'high',
        notificationChannels: ['in-app'],
      });

      // Spy on EventBus
      const publishSpy = jest.spyOn(eventBus, 'publish');

      // Process due reminders directly via service worker logic
      await (reminderService as any).processDueReminders();

      expect(publishSpy).toHaveBeenCalledWith(
        dueReminder._id.toString(),
        'Reminder',
        DomainEventType.ReminderTriggered,
        expect.objectContaining({
          ownerId,
          petId,
          title: 'Dental Exam',
        }),
        expect.anything()
      );

      // Verify that nextTrigger was advanced into the future
      const updated = await ReminderModel.findById(dueReminder._id.toString());
      expect(new Date(updated!.nextTrigger).getTime()).toBeGreaterThan(Date.now());
      expect(updated!.missedCount).toBe(1);

      publishSpy.mockRestore();
    });

    it('deactivates one-off (frequency: "once") reminders after triggering', async () => {
      const onceReminder = await reminderRepository.create({
        ownerId,
        petId,
        type: 'grooming',
        title: 'Nail Trim Once',
        message: 'Trim front claws',
        frequency: 'once',
        nextTrigger: new Date(Date.now() - 60000).toISOString(),
        priority: 'low',
      });

      await (reminderService as any).processDueReminders();

      const finished = await ReminderModel.findById(onceReminder._id.toString());
      expect(finished?.isActive).toBe(false);
    });

    it('escalates priority, notification channels, and emits emergency event when missedCount exceeds maxRetries', async () => {
      const publishSpy = jest.spyOn(eventBus, 'publish');

      const escalatedReminder = await reminderRepository.create({
        ownerId,
        petId,
        type: 'medication',
        title: 'Critical Insulin Dose',
        message: 'Give 2 units',
        frequency: 'daily',
        nextTrigger: new Date(Date.now() - 60000).toISOString(),
        priority: 'medium',
        missedCount: 3, // Already reached maxRetries
        escalation: {
          maxRetries: 2,
          retryIntervalMinutes: 10,
          emergencyEscalation: true,
          notifySecondaryOwner: true,
        },
        notificationChannels: ['in-app', 'push'],
      });

      await reminderService.triggerReminder(escalatedReminder as any);

      // Verify domain event published with emergency priority & expanded channels
      expect(publishSpy).toHaveBeenCalledWith(
        escalatedReminder._id.toString(),
        'Reminder',
        DomainEventType.ReminderTriggered,
        expect.objectContaining({
          priority: 'emergency',
          isEscalated: true,
          notificationChannels: expect.arrayContaining(['in-app', 'push', 'email', 'sms']),
          title: expect.stringContaining('[URGENT REMINDER]'),
        }),
        expect.anything()
      );

      // Verify DomainEventType.EmergencyTriggered was also fired
      expect(publishSpy).toHaveBeenCalledWith(
        escalatedReminder._id.toString(),
        'ReminderEscalation',
        DomainEventType.EmergencyTriggered,
        expect.objectContaining({
          priority: 'emergency',
          ownerId,
          petId,
        }),
        expect.anything()
      );

      publishSpy.mockRestore();
    });

    it('calculates next trigger correctly for custom cron expression', () => {
      const mockReminder: any = {
        _id: 'mock-1',
        frequency: 'custom',
        cronExpression: '0 9 * * 1', // 9:00 AM every Monday
        nextTrigger: new Date().toISOString(),
        missedCount: 0,
      };

      const result = reminderService.calculateNextTrigger(mockReminder);
      expect(result.deactivate).toBe(false);
      expect(new Date(result.nextTrigger).getTime()).toBeGreaterThan(Date.now());
    });
  });
});
