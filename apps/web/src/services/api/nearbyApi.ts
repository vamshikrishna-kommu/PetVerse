import api from '@/shared/lib/axios';
import type { IClinic } from '@petverse/shared-types';

export interface IClinicWithDistance extends IClinic {
  distanceKm?: number;
  type?: string;
  emergencyAvailable?: boolean;
}

export interface IReview {
  _id: string;
  targetId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface NearbyQueryParams {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  type?: string;
  search?: string;
  locality?: string;
  emergencyOnly?: boolean;
  openNow?: boolean;
  minRating?: number;
}

export const nearbyApi = {
  getNearbyServices: async (params: NearbyQueryParams = {}): Promise<IClinicWithDistance[]> => {
    const response = await api.get<{ success: boolean; data: IClinicWithDistance[] }>(
      '/nearby/services',
      { params }
    );
    return response.data.data;
  },

  getClinicById: async (id: string): Promise<IClinicWithDistance> => {
    const response = await api.get<{ success: boolean; data: IClinicWithDistance }>(
      `/nearby/services/${id}`
    );
    return response.data.data;
  },

  getClinicReviews: async (id: string): Promise<IReview[]> => {
    const response = await api.get<{ success: boolean; data: IReview[] }>(
      `/nearby/services/${id}/reviews`
    );
    return response.data.data;
  },

  addReview: async (id: string, data: { rating: number; comment: string }): Promise<IReview> => {
    const response = await api.post<{ success: boolean; data: IReview }>(
      `/nearby/services/${id}/reviews`,
      data
    );
    return response.data.data;
  },
};
