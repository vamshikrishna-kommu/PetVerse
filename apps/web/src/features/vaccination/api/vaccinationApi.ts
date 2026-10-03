import { axiosInstance } from '@/shared/lib/axios';
import { API_PREFIX } from '@petverse/shared-constants';
import type { ApiResponse, IVaccineDefinition, IVaccinationRecord, IVaccinationReaction, IVaccinationCertificate, IVaccinationSchedule } from '@petverse/shared-types';

const VACCINATION_API = `${API_PREFIX}/vaccinations`;

export const vaccinationApi = {
  // Definitions
  getDefinitions: async (species?: string) => {
    const params = species ? { species } : {};
    const { data } = await axiosInstance.get<ApiResponse<IVaccineDefinition[]>>(`${VACCINATION_API}/definitions`, { params });
    return data.data!;
  },

  // Schedule & Analytics
  getSchedule: async (petId: string, species: string, dob?: string) => {
    const params = { species, dob };
    const { data } = await axiosInstance.get<ApiResponse<IVaccinationSchedule>>(`${VACCINATION_API}/${petId}/schedule`, { params });
    return data.data!;
  },
  
  getAnalytics: async (petId: string) => {
    const { data } = await axiosInstance.get<ApiResponse<any>>(`${VACCINATION_API}/${petId}/analytics`);
    return data.data!;
  },

  // Records
  getRecords: async (petId: string) => {
    const { data } = await axiosInstance.get<ApiResponse<IVaccinationRecord[]>>(`${VACCINATION_API}/${petId}/records`);
    return data.data!;
  },
  
  recordVaccination: async (petId: string, recordData: Partial<IVaccinationRecord>) => {
    const { data } = await axiosInstance.post<ApiResponse<IVaccinationRecord>>(`${VACCINATION_API}/${petId}/records`, recordData);
    return data.data!;
  },
  
  deleteRecord: async (petId: string, recordId: string) => {
    const { data } = await axiosInstance.delete<ApiResponse<null>>(`${VACCINATION_API}/${petId}/records/${recordId}`);
    return data.success;
  },

  // Reactions
  getReactions: async (petId: string) => {
    const { data } = await axiosInstance.get<ApiResponse<IVaccinationReaction[]>>(`${VACCINATION_API}/${petId}/reactions`);
    return data.data!;
  },
  
  recordReaction: async (petId: string, reactionData: Partial<IVaccinationReaction>) => {
    const { data } = await axiosInstance.post<ApiResponse<IVaccinationReaction>>(`${VACCINATION_API}/${petId}/reactions`, reactionData);
    return data.data!;
  },

  // Certificates
  getCertificates: async (petId: string) => {
    const { data } = await axiosInstance.get<ApiResponse<IVaccinationCertificate[]>>(`${VACCINATION_API}/${petId}/certificates`);
    return data.data!;
  },
  
  createCertificate: async (petId: string, certData: Partial<IVaccinationCertificate>) => {
    const { data } = await axiosInstance.post<ApiResponse<IVaccinationCertificate>>(`${VACCINATION_API}/${petId}/certificates`, certData);
    return data.data!;
  },
};
