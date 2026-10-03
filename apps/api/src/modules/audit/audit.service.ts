import { AuditLogModel, type IAuditLog } from './audit.model';
import { logger } from '../../shared/utils/logger';

export interface LogActionParams {
  actorId: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditQueryFilter {
  actorId?: string;
  action?: string;
  targetType?: string;
  page?: number;
  limit?: number;
}

export const auditService = {
  /**
   * Log an administrative security or state change action
   */
  async log(params: LogActionParams): Promise<IAuditLog> {
    try {
      const entry = await AuditLogModel.create({
        ...params,
        ipAddress: params.ipAddress || 'unknown',
        userAgent: params.userAgent || 'unknown',
      });
      logger.info(`[AuditLog] ${params.actorEmail} performed ${params.action} on ${params.targetType}:${params.targetId}`);
      return entry;
    } catch (err: any) {
      logger.error('[AuditLog] Failed to create audit log entry', { error: err?.message });
      throw err;
    }
  },

  /**
   * Query audit logs with pagination and filters
   */
  async getAuditLogs(filter: AuditQueryFilter = {}): Promise<{ data: IAuditLog[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 20));
    const skip = (page - 1) * limit;

    const query: Record<string, any> = {};
    if (filter.actorId) query.actorId = filter.actorId;
    if (filter.action) query.action = filter.action;
    if (filter.targetType) query.targetType = filter.targetType;

    const [data, total] = await Promise.all([
      AuditLogModel.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
      AuditLogModel.countDocuments(query).exec(),
    ]);

    return {
      data: data as unknown as IAuditLog[],
      total,
      page,
      limit,
    };
  },
};
