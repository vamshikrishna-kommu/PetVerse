import mongoose from 'mongoose';
import { NotificationService } from '../services/notification.service';
import { notificationRepository } from '../repositories/notification.repository';
import { NotificationModel } from '../models/notification.model';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/petverse_test';

describe('Notification Service Unit & Integration Tests', () => {
  jest.setTimeout(30000);

  const userId = new mongoose.Types.ObjectId().toString();
  const notificationService = new NotificationService();

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }
  });

  afterAll(async () => {
    await NotificationModel.deleteMany({ userId });
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe('1. Notification Dispatching', () => {
    it('dispatches an in-app notification and persists it with queued channel deliveries', async () => {
      const notification = await notificationService.dispatch(
        userId,
        'Vaccination Booster Due',
        'Rabies booster is scheduled for next Monday.',
        'vaccination',
        'high',
        ['in-app'],
        { petName: 'Barnaby' }
      );

      expect(notification).toBeDefined();
      expect(notification.title).toBe('Vaccination Booster Due');
      expect(notification.isRead).toBe(false);
      expect(notification.priority).toBe('high');
      expect(notification.deliveries).toHaveLength(1);
      expect(notification.deliveries[0].channel).toBe('in-app');
    });

    it('correctly increments and reports unread notification count', async () => {
      const initialCount = await notificationRepository.countUnread(userId);

      await notificationService.dispatch(
        userId,
        'Appointment Confirmed',
        'Your vet visit has been accepted.',
        'appointment',
        'medium',
        ['in-app']
      );

      const afterCount = await notificationRepository.countUnread(userId);
      expect(afterCount).toBe(initialCount + 1);
    });
  });

  describe('2. Read Status & Bulk Operations', () => {
    it('marks a single notification as read', async () => {
      const created = await notificationService.dispatch(
        userId,
        'Health Alert',
        'Weight drop detected',
        'health',
        'emergency',
        ['in-app']
      );

      const updated = await notificationRepository.markAsRead(created._id.toString(), userId);
      expect(updated?.isRead).toBe(true);
    });

    it('bulk marks all user notifications as read', async () => {
      await notificationService.dispatch(userId, 'Note 1', 'Text 1', 'system');
      await notificationService.dispatch(userId, 'Note 2', 'Text 2', 'system');

      await notificationRepository.markAllAsRead(userId);

      const unreadCount = await notificationRepository.countUnread(userId);
      expect(unreadCount).toBe(0);
    });
  });
});
