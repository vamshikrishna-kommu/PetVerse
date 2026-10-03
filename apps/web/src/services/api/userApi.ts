import api from '../../shared/lib/axios';
import type { IUser } from '@petverse/shared-types';

export interface UserDashboardStats {
  petCount: number;
  medicalRecordCount: number;
  activeVaccinationCount: number;
  pendingReminderCount: number;
}

export const userApi = {
  getStats: () =>
    api.get<{ data: UserDashboardStats }>('/users/me/stats').then((res) => res.data.data),

  updateProfile: (data: { firstName?: string; lastName?: string; phone?: string; bio?: string }) =>
    api.patch<{ data: IUser }>('/users/me', data).then((res) => res.data.data),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post<{ data: IUser }>('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((res) => res.data.data);
  },

  updatePreferences: (preferences: any) =>
    api.patch<{ data: IUser }>('/users/me/preferences', preferences).then((res) => res.data.data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post<{ message: string }>('/users/me/change-password', data).then((res) => res.data),

  exportData: () =>
    api.get<{ data: any }>('/users/me/export').then((res) => res.data.data),

  deleteAccount: () =>
    api.delete<{ message: string }>('/users/me').then((res) => res.data),
};
