import { axiosInstance } from '@/shared/lib/axios';
import type { IPet, ApiResponse } from '@petverse/shared-types';

export interface PetQueryParams {
  search?: string;
  species?: string;
  breed?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const petsApi = {
  // Get all pets for the authenticated user
  getPets: async (params?: PetQueryParams): Promise<{ data: IPet[]; total: number; page: number; limit: number }> => {
    const { data } = await axiosInstance.get('/pets', { params });
    return data.data || { data: [], total: 0, page: 1, limit: 20 };
  },

  // Get a single pet by ID
  getPet: async (id: string): Promise<IPet> => {
    const { data } = await axiosInstance.get<ApiResponse<IPet>>(`/pets/${id}`);
    if (!data.data) throw new Error('Pet not found');
    return data.data;
  },

  // Create a new pet
  createPet: async (petData: Partial<IPet>): Promise<IPet> => {
    const { data } = await axiosInstance.post<ApiResponse<IPet>>('/pets', petData);
    if (!data.data) throw new Error('Failed to create pet');
    return data.data;
  },

  // Update an existing pet
  updatePet: async ({ id, data }: { id: string; data: Partial<IPet> }): Promise<IPet> => {
    const { data: res } = await axiosInstance.patch<ApiResponse<IPet>>(`/pets/${id}`, data);
    if (!res.data) throw new Error('Failed to update pet');
    return res.data;
  },

  // Delete a pet
  deletePet: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/pets/${id}`);
  },

  // Upload pet avatar
  uploadAvatar: async (id: string, file: File): Promise<IPet> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await axiosInstance.post<ApiResponse<IPet>>(
      `/pets/${id}/avatar`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    if (!data.data) throw new Error('Failed to upload avatar');
    return data.data;
  },

  // Get timeline events for a pet
  getPetTimeline: async (id: string) => {
    const { data } = await axiosInstance.get(`/pets/${id}/timeline`);
    return data.data || [];
  },

  // Get community-wide lost pets
  getLostPets: async (params?: { species?: string; search?: string; page?: number; limit?: number }): Promise<{ data: IPet[]; total: number; page: number; limit: number }> => {
    const { data } = await axiosInstance.get('/pets/lost', { params });
    return data.data || { data: [], total: 0, page: 1, limit: 20 };
  },

  // Gallery
  uploadGallery: async (id: string, files: File[]): Promise<IPet> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));
    const { data } = await axiosInstance.post<ApiResponse<IPet>>(
      `/pets/${id}/gallery`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    if (!data.data) throw new Error('Failed to upload gallery images');
    return data.data;
  },

  removeGalleryImage: async (id: string, imageUrl: string): Promise<IPet> => {
    const { data } = await axiosInstance.delete<ApiResponse<IPet>>(`/pets/${id}/gallery`, {
      data: { imageUrl },
    });
    if (!data.data) throw new Error('Failed to remove gallery image');
    return data.data;
  },

  setPrimaryGalleryImage: async (id: string, imageUrl: string): Promise<IPet> => {
    const { data } = await axiosInstance.patch<ApiResponse<IPet>>(`/pets/${id}/gallery/primary`, {
      imageUrl,
    });
    if (!data.data) throw new Error('Failed to set primary image');
    return data.data;
  },
};
