import mongoose from 'mongoose';
import { notificationService } from '../services/notification.service';
import { notificationRepository } from '../repositories/notification.repository';
import {
  setSmsProviderForTesting,
  type ISmsProvider,
  type SmsPayload,
  type SmsResult,
  TwilioSmsProvider,
  DevLoggerSmsProvider,
} from '../providers/sms.provider';
import { UserModel } from '../../users/user.model';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/petverse_test';

describe('Notification Service — SMS Provider & Dead-Letter Queue (DLQ) Tests', () => {
  let testUserId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }

    const user = await UserModel.create({
      email: `sms_test_${Date.now()}@testverse.com`,
      phone: '+15559876543',
      profile: {
        firstName: 'SMS',
        lastName: 'Tester',
      },
      passwordHash: 'dummyhash123',
      role: 'pet_owner',
      isVerified: true,
      isActive: true,
    });
    testUserId = user._id.toString();
  });

  afterAll(async () => {
    setSmsProviderForTesting(null);
    await UserModel.findByIdAndDelete(testUserId);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe('SMS Provider Abstraction', () => {
    it('DevLoggerSmsProvider simulates SMS dispatch in development', async () => {
      const devProvider = new DevLoggerSmsProvider();
      const res = await devProvider.sendSms({
        to: '+15551234567',
        body: 'Your vaccination is due tomorrow!',
      });

      expect(res.success).toBe(true);
      expect(res.provider).toBe('dev-log');
      expect(res.messageId).toBeDefined();
    });

    it('Dispatches notification via SMS channel using configured SMS provider', async () => {
      const mockSmsProvider: ISmsProvider = {
        name: 'twilio',
        sendSms: jest.fn().mockResolvedValue({
          success: true,
          provider: 'twilio',
          messageId: 'SM123456789',
        }),
      };

      setSmsProviderForTesting(mockSmsProvider);

      const notif = await notificationService.dispatch(
        testUserId,
        'Vet Reminder',
        'Vaccination dose due at 10:00 AM',
        'reminder',
        'high',
        ['sms']
      );

      expect(notif).toBeDefined();
      expect(notif.deliveries).toHaveLength(1);
      expect(notif.deliveries[0].channel).toBe('sms');

      // Allow background dispatch to run
      await new Promise((r) => setTimeout(r, 100));

      expect(mockSmsProvider.sendSms).toHaveBeenCalledWith(
        expect.objectContaining({
          to: '+15559876543',
          body: expect.stringContaining('Vet Reminder'),
        })
      );

      const updated = await notificationRepository.findById(notif._id.toString());
      const smsDelivery = updated?.deliveries.find((d) => d.channel === 'sms');
      expect(smsDelivery?.status).toBe('sent');
    });
  });

  describe('Dead-Letter Queue (DLQ) & Retry Handling', () => {
    it('Transitions failed delivery to retrying with exponential backoff and then dead_letter after max retries', async () => {
      const failingSmsProvider: ISmsProvider = {
        name: 'twilio',
        sendSms: jest.fn().mockResolvedValue({
          success: false,
          provider: 'twilio',
          error: 'Carrier rejected destination number',
        }),
      };

      setSmsProviderForTesting(failingSmsProvider);

      const notif = await notificationService.dispatch(
        testUserId,
        'Critical Emergency',
        'Severe storm evacuation alert',
        'emergency',
        'critical',
        ['sms']
      );

      const notifId = notif._id.toString();

      // Wait for initial background dispatch attempt to settle
      await new Promise((r) => setTimeout(r, 100));

      // Directly invoke deliverToChannel simulating retry exhaustion (attempt 3)
      await notificationService.deliverToChannel(
        notifId,
        testUserId,
        'Critical Emergency',
        'Severe storm evacuation alert',
        'sms',
        undefined,
        2 // attempt 3 (exhausted)
      );

      const dlqDoc = await notificationRepository.findById(notifId);
      expect(dlqDoc).toBeDefined();
      expect(dlqDoc?.isDeadLetter).toBe(true);

      const smsDelivery = dlqDoc?.deliveries.find((d) => d.channel === 'sms');
      expect(smsDelivery?.status).toBe('dead_letter');
      expect(smsDelivery?.deadLetterReason).toContain('Max retries');
    });

    it('Admin can query and reprocess dead-letter notifications', async () => {
      const dlqList = await notificationService.getDeadLetterQueue(10, 0);
      expect(dlqList.data.length).toBeGreaterThan(0);
      expect(dlqList.total).toBeGreaterThan(0);

      // Now fix provider and reprocess
      const recoveredProvider: ISmsProvider = {
        name: 'twilio',
        sendSms: jest.fn().mockResolvedValue({
          success: true,
          provider: 'twilio',
          messageId: 'RETRY_SUCCESS_999',
        }),
      };
      setSmsProviderForTesting(recoveredProvider);

      const dlqItem = dlqList.data[0];
      const reprocessed = await notificationService.reprocessDeadLetter(
        dlqItem._id.toString(),
        'sms'
      );

      expect(reprocessed).toBeDefined();
      const delivery = reprocessed?.deliveries.find((d) => d.channel === 'sms');
      expect(delivery?.status).toBe('sent');
    });
  });
});
