import api from '@/shared/lib/axios';
import type { IGrowthLog } from '@petverse/shared-types';

export interface IGrowthAnalytics {
  currentWeight: number;
  previousWeight: number;
  weightChange: number;
  percentageChange: number;
  currentHeight: number;
  measurementCount: number;
  lastMeasurementDate: string | null;
}

export const growthApi = {
  getLogs: async (petId: string): Promise<IGrowthLog[]> => {
    const response = await api.get<{ success: boolean; data: IGrowthLog[] }>(
      `/pets/${petId}/growth`
    );
    return response.data.data;
  },

  getAnalytics: async (petId: string): Promise<IGrowthAnalytics> => {
    const response = await api.get<{ success: boolean; data: IGrowthAnalytics }>(
      `/pets/${petId}/growth/analytics`
    );
    return response.data.data;
  },

  createLog: async (petId: string, data: Partial<IGrowthLog>): Promise<IGrowthLog> => {
    const response = await api.post<{ success: boolean; data: IGrowthLog }>(
      `/pets/${petId}/growth`,
      data
    );
    return response.data.data;
  },

  updateLog: async (
    petId: string,
    growthId: string,
    data: Partial<IGrowthLog>
  ): Promise<IGrowthLog> => {
    const response = await api.patch<{ success: boolean; data: IGrowthLog }>(
      `/pets/${petId}/growth/${growthId}`,
      data
    );
    return response.data.data;
  },

  deleteLog: async (petId: string, growthId: string): Promise<void> => {
    await api.delete(`/pets/${petId}/growth/${growthId}`);
  },
};
