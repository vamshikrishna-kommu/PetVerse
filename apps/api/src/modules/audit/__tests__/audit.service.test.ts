import mongoose from 'mongoose';
import { auditService } from '../audit.service';
import { AuditLogModel } from '../audit.model';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/petverse_test';

describe('AuditService Unit Tests', () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }
    await AuditLogModel.deleteMany({});
  });

  afterAll(async () => {
    await AuditLogModel.deleteMany({});
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  it('records an administrative action audit log', async () => {
    const entry = await auditService.log({
      actorId: 'admin_123',
      actorEmail: 'admin@petverse.app',
      actorRole: 'admin',
      action: 'USER_DEACTIVATED',
      targetType: 'User',
      targetId: 'user_456',
      details: { isActive: false, reason: 'Security policy violation' },
      ipAddress: '192.168.1.50',
      userAgent: 'Mozilla/5.0 TestBrowser',
    });

    expect(entry).toBeDefined();
    expect(entry.actorEmail).toBe('admin@petverse.app');
    expect(entry.action).toBe('USER_DEACTIVATED');
    expect(entry.targetId).toBe('user_456');
    expect(entry.details?.isActive).toBe(false);
  });

  it('queries audit logs with filter and pagination', async () => {
    // Add two more logs
    await auditService.log({
      actorId: 'admin_123',
      actorEmail: 'admin@petverse.app',
      actorRole: 'admin',
      action: 'CLINIC_VERIFIED',
      targetType: 'Clinic',
      targetId: 'clinic_789',
    });

    await auditService.log({
      actorId: 'admin_999',
      actorEmail: 'super@petverse.app',
      actorRole: 'admin',
      action: 'USER_ACTIVATED',
      targetType: 'User',
      targetId: 'user_456',
    });

    // Query all logs
    const all = await auditService.getAuditLogs({ limit: 10 });
    expect(all.total).toBe(3);
    expect(all.data.length).toBe(3);

    // Query logs filtered by action
    const filtered = await auditService.getAuditLogs({ action: 'CLINIC_VERIFIED' });
    expect(filtered.total).toBe(1);
    expect(filtered.data[0].targetType).toBe('Clinic');

    // Query logs filtered by actor
    const actorFiltered = await auditService.getAuditLogs({ actorId: 'admin_123' });
    expect(actorFiltered.total).toBe(2);
  });
});
