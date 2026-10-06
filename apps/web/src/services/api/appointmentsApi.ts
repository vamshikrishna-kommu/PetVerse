import api from '@/shared/lib/axios';
import type { IAppointment } from '@petverse/shared-types';

export const appointmentsApi = {
  getUserAppointments: async (status?: string): Promise<IAppointment[]> => {
    const response = await api.get<{ success: boolean; data: IAppointment[] }>(
      '/appointments',
      { params: { status } }
    );
    return response.data.data;
  },

  getAppointmentById: async (id: string): Promise<IAppointment> => {
    const response = await api.get<{ success: boolean; data: IAppointment }>(
      `/appointments/${id}`
    );
    return response.data.data;
  },

  getAvailableSlots: async (clinicId?: string, date?: string): Promise<string[]> => {
    const response = await api.get<{ success: boolean; data: string[] }>(
      '/appointments/available-slots',
      { params: { clinicId, date } }
    );
    return response.data.data;
  },

  bookAppointment: async (data: {
    petId: string;
    clinicId?: string;
    clinicName?: string;
    clinicAddress?: string;
    appointmentDate: string;
    startTime: string;
    type: string;
    notes?: string;
  }): Promise<IAppointment> => {
    const response = await api.post<{ success: boolean; data: IAppointment }>(
      '/appointments',
      data
    );
    return response.data.data;
  },

  cancelAppointment: async (id: string, reason?: string): Promise<IAppointment> => {
    const response = await api.post<{ success: boolean; data: IAppointment }>(
      `/appointments/${id}/cancel`,
      { reason }
    );
    return response.data.data;
  },

  completeAppointment: async (id: string): Promise<IAppointment> => {
    const response = await api.post<{ success: boolean; data: IAppointment }>(
      `/appointments/${id}/complete`
    );
    return response.data.data;
  },

  rescheduleAppointment: async (
    id: string,
    data: { appointmentDate: string; startTime: string }
  ): Promise<IAppointment> => {
    const response = await api.put<{ success: boolean; data: IAppointment }>(
      `/appointments/${id}`,
      data
    );
    return response.data.data;
  },
};
