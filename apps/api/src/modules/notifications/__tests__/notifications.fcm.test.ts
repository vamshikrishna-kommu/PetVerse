import mongoose from 'mongoose';
import { UserModel } from '../../users/user.model';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/petverse_test';

describe('Phase 4 — FCM Push Notification Token Management', () => {
  let userId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }

    const user = await UserModel.create({
      email: `fcm_test_${Date.now()}@example.com`,
      profile: {
        firstName: 'FCM',
        lastName: 'Tester',
      },
      isVerified: true,
    });
    userId = user._id.toString();
  });

  afterAll(async () => {
    if (userId) {
      await UserModel.findByIdAndDelete(userId);
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  it('should register and update FCM token securely for a user', async () => {
    const fakeFcmToken = 'fcm_token_sample_abc_123456789';

    await UserModel.findByIdAndUpdate(userId, { fcmToken: fakeFcmToken });

    // Select fcmToken explicitly since select: false protects it from public projection
    const userWithToken = await UserModel.findById(userId).select('+fcmToken');
    expect(userWithToken?.fcmToken).toBe(fakeFcmToken);
  });

  it('should remove FCM token when user unsubscribes', async () => {
    await UserModel.findByIdAndUpdate(userId, { $unset: { fcmToken: 1 } });

    const userWithoutToken = await UserModel.findById(userId).select('+fcmToken');
    expect(userWithoutToken?.fcmToken).toBeUndefined();
  });
});
