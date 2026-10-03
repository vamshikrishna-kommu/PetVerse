import api from '@/shared/lib/axios';
import type { IUser, IPet } from '@petverse/shared-types';

export interface AdminSystemStats {
  totalUsers: number;
  activeUsers: number;
  totalPets: number;
  totalLostPets: number;
  totalAppointments: number;
  totalReminders: number;
  totalNotifications: number;
  systemStatus: string;
  uptimeSeconds: number;
}

export interface UserListResponse {
  data: IUser[];
  total: number;
}

export interface AuditLogItem {
  _id: string;
  actorId: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export const adminApi = {
  getSystemStats: async (): Promise<AdminSystemStats> => {
    const response = await api.get<{ success: boolean; data: AdminSystemStats }>(
      '/users/admin/stats'
    );
    return response.data.data;
  },

  listUsers: async (params?: {
    search?: string;
    role?: string;
    page?: number;
    limit?: number;
  }): Promise<UserListResponse> => {
    const response = await api.get<{ success: boolean; data: UserListResponse }>(
      '/users',
      { params }
    );
    return response.data.data;
  },

  toggleUserStatus: async (
    id: string,
    data: { isActive?: boolean; role?: string }
  ): Promise<IUser> => {
    const response = await api.patch<{ success: boolean; data: IUser }>(
      `/users/${id}/status`,
      data
    );
    return response.data.data;
  },

  getAuditLogs: async (params?: {
    action?: string;
    targetType?: string;
    page?: number;
    limit?: number;
  }): Promise<{ logs: AuditLogItem[]; total: number; page: number; totalPages: number }> => {
    const response = await api.get<{ success: boolean; data: { logs: AuditLogItem[]; total: number; page: number; totalPages: number } }>(
      '/users/admin/audit-logs',
      { params }
    );
    return response.data.data;
  },

  listAllPets: async (params?: { search?: string; page?: number; limit?: number }): Promise<{ data: IPet[]; total: number }> => {
    const response = await api.get<{ success: boolean; data: { data: IPet[]; total: number } }>(
      '/pets',
      { params }
    );
    return response.data.data;
  },

  listLostFoundReports: async (params?: any): Promise<any> => {
    const response = await api.get('/lost-found', { params });
    return response.data.data;
  },

  moderateLostFoundReport: async (id: string, moderationStatus: string): Promise<any> => {
    const response = await api.patch(`/lost-found/${id}/moderate`, { moderationStatus });
    return response.data.data;
  },

  getNotificationAnalytics: async (): Promise<{
    totalSent: number;
    totalDeliveries: number;
    deliveredCount: number;
    failedCount: number;
    deadLettersCount: number;
    pushDeliveryRate: string;
    emailOpenRate: string;
    reminderCompliance: {
      totalReminders: number;
      activeReminders: number;
      medicationCompliance: string;
      vaccinationAttendance: string;
      appointmentNoShows: string;
    };
  }> => {
    const response = await api.get('/notifications/analytics');
    return response.data.data;
  },
};
