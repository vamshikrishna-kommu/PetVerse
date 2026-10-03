import { axiosInstance } from '@/shared/lib/axios';
import type {
  ApiResponse,
  IMedicalRecord,
  IVitalLog,
  ICondition,
  IAllergy,
  IPrescription,
  ILabReport,
  IImagingStudy,
  ISurgery,
  IHealthDashboard,
  IHealthAnalytics,
  IHealthSummary,
} from '@petverse/shared-types';

export const healthApi = {
  // ─── Dashboard & Analytics ───────────────────────────────────
  getDashboard: async (petId: string): Promise<IHealthDashboard> => {
    const { data } = await axiosInstance.get<ApiResponse<IHealthDashboard>>(`/pets/${petId}/health/dashboard`);
    if (!data.data) throw new Error('Failed to fetch dashboard');
    return data.data;
  },

  getAnalytics: async (petId: string, periodDays?: number): Promise<IHealthAnalytics> => {
    const { data } = await axiosInstance.get<ApiResponse<IHealthAnalytics>>(`/pets/${petId}/health/analytics`, {
      params: { periodDays },
    });
    if (!data.data) throw new Error('Failed to fetch analytics');
    return data.data;
  },

  getSummary: async (petId: string): Promise<IHealthSummary> => {
    const { data } = await axiosInstance.get<ApiResponse<IHealthSummary>>(`/pets/${petId}/health/summary`);
    if (!data.data) throw new Error('Failed to fetch summary');
    return data.data;
  },

  // ─── Medical Records ─────────────────────────────────────────
  getRecords: async (petId: string, params?: { status?: string; page?: number; limit?: number }) => {
    const { data } = await axiosInstance.get(`/pets/${petId}/health/records`, { params });
    return data.data || { data: [], total: 0, page: 1, limit: 20 };
  },

  getRecord: async (petId: string, recordId: string): Promise<IMedicalRecord> => {
    const { data } = await axiosInstance.get<ApiResponse<IMedicalRecord>>(`/pets/${petId}/health/records/${recordId}`);
    if (!data.data) throw new Error('Record not found');
    return data.data;
  },

  createRecord: async (petId: string, payload: Partial<IMedicalRecord>): Promise<IMedicalRecord> => {
    const { data } = await axiosInstance.post<ApiResponse<IMedicalRecord>>(`/pets/${petId}/health/records`, payload);
    if (!data.data) throw new Error('Failed to create record');
    return data.data;
  },

  updateRecord: async (petId: string, recordId: string, payload: Partial<IMedicalRecord>): Promise<IMedicalRecord> => {
    const { data } = await axiosInstance.patch<ApiResponse<IMedicalRecord>>(`/pets/${petId}/health/records/${recordId}`, payload);
    if (!data.data) throw new Error('Failed to update record');
    return data.data;
  },

  deleteRecord: async (petId: string, recordId: string): Promise<void> => {
    await axiosInstance.delete(`/pets/${petId}/health/records/${recordId}`);
  },

  // ─── Vitals ──────────────────────────────────────────────────
  getVitals: async (petId: string, params?: { sinceDate?: string; limit?: number }): Promise<IVitalLog[]> => {
    const { data } = await axiosInstance.get<ApiResponse<IVitalLog[]>>(`/pets/${petId}/health/vitals`, { params });
    return data.data || [];
  },

  logVital: async (petId: string, payload: Partial<IVitalLog>): Promise<IVitalLog> => {
    const { data } = await axiosInstance.post<ApiResponse<IVitalLog>>(`/pets/${petId}/health/vitals`, payload);
    if (!data.data) throw new Error('Failed to log vital');
    return data.data;
  },

  deleteVital: async (petId: string, vitalId: string): Promise<void> => {
    await axiosInstance.delete(`/pets/${petId}/health/vitals/${vitalId}`);
  },

  // ─── Conditions ──────────────────────────────────────────────
  getConditions: async (petId: string): Promise<ICondition[]> => {
    const { data } = await axiosInstance.get<ApiResponse<ICondition[]>>(`/pets/${petId}/health/conditions`);
    return data.data || [];
  },

  addCondition: async (petId: string, payload: Partial<ICondition>): Promise<ICondition> => {
    const { data } = await axiosInstance.post<ApiResponse<ICondition>>(`/pets/${petId}/health/conditions`, payload);
    if (!data.data) throw new Error('Failed to add condition');
    return data.data;
  },

  updateCondition: async (petId: string, condId: string, payload: Partial<ICondition>): Promise<ICondition> => {
    const { data } = await axiosInstance.patch<ApiResponse<ICondition>>(`/pets/${petId}/health/conditions/${condId}`, payload);
    if (!data.data) throw new Error('Failed to update condition');
    return data.data;
  },

  addProgressNote: async (petId: string, condId: string, note: string): Promise<ICondition> => {
    const { data } = await axiosInstance.post<ApiResponse<ICondition>>(`/pets/${petId}/health/conditions/${condId}/progress`, { note });
    if (!data.data) throw new Error('Failed to add progress note');
    return data.data;
  },

  deleteCondition: async (petId: string, condId: string): Promise<void> => {
    await axiosInstance.delete(`/pets/${petId}/health/conditions/${condId}`);
  },

  // ─── Allergies ───────────────────────────────────────────────
  getAllergies: async (petId: string): Promise<IAllergy[]> => {
    const { data } = await axiosInstance.get<ApiResponse<IAllergy[]>>(`/pets/${petId}/health/allergies`);
    return data.data || [];
  },

  addAllergy: async (petId: string, payload: Partial<IAllergy>): Promise<IAllergy> => {
    const { data } = await axiosInstance.post<ApiResponse<IAllergy>>(`/pets/${petId}/health/allergies`, payload);
    if (!data.data) throw new Error('Failed to add allergy');
    return data.data;
  },

  updateAllergy: async (petId: string, allergyId: string, payload: Partial<IAllergy>): Promise<IAllergy> => {
    const { data } = await axiosInstance.patch<ApiResponse<IAllergy>>(`/pets/${petId}/health/allergies/${allergyId}`, payload);
    if (!data.data) throw new Error('Failed to update allergy');
    return data.data;
  },

  deleteAllergy: async (petId: string, allergyId: string): Promise<void> => {
    await axiosInstance.delete(`/pets/${petId}/health/allergies/${allergyId}`);
  },

  // ─── Prescriptions (served by Medication module) ─────────────────────
  // NOTE: prescriptions were moved from /health/prescriptions to /medications/pets/:petId/prescriptions
  getPrescriptions: async (petId: string, status?: string): Promise<IPrescription[]> => {
    const { data } = await axiosInstance.get<ApiResponse<IPrescription[]>>(`/medications/pets/${petId}/prescriptions`, {
      params: { status },
    });
    return data.data || [];
  },

  createPrescription: async (petId: string, payload: Partial<IPrescription>): Promise<IPrescription> => {
    const { data } = await axiosInstance.post<ApiResponse<IPrescription>>(`/medications/pets/${petId}/prescriptions`, payload);
    if (!data.data) throw new Error('Failed to create prescription');
    return data.data;
  },

  updatePrescriptionStatus: async (petId: string, rxId: string, payload: Partial<IPrescription>): Promise<IPrescription> => {
    const { data } = await axiosInstance.patch<ApiResponse<IPrescription>>(`/medications/pets/${petId}/prescriptions/${rxId}`, payload);
    if (!data.data) throw new Error('Failed to update prescription');
    return data.data;
  },

  deletePrescription: async (petId: string, rxId: string): Promise<void> => {
    await axiosInstance.delete(`/medications/pets/${petId}/prescriptions/${rxId}`);
  },

  // ─── Lab Reports ─────────────────────────────────────────────
  getLabs: async (petId: string, params?: { category?: string; page?: number; limit?: number }) => {
    const { data } = await axiosInstance.get(`/pets/${petId}/health/labs`, { params });
    return data.data || { data: [], total: 0, page: 1, limit: 20 };
  },

  createLab: async (petId: string, payload: Partial<ILabReport>): Promise<ILabReport> => {
    const { data } = await axiosInstance.post<ApiResponse<ILabReport>>(`/pets/${petId}/health/labs`, payload);
    if (!data.data) throw new Error('Failed to create lab report');
    return data.data;
  },

  updateLab: async (petId: string, labId: string, payload: Partial<ILabReport>): Promise<ILabReport> => {
    const { data } = await axiosInstance.patch<ApiResponse<ILabReport>>(`/pets/${petId}/health/labs/${labId}`, payload);
    if (!data.data) throw new Error('Failed to update lab report');
    return data.data;
  },

  // ─── Imaging Studies ─────────────────────────────────────────
  getImaging: async (petId: string, params?: { page?: number; limit?: number }) => {
    const { data } = await axiosInstance.get(`/pets/${petId}/health/imaging`, { params });
    return data.data || { data: [], total: 0, page: 1, limit: 20 };
  },

  createImaging: async (petId: string, payload: Partial<IImagingStudy>): Promise<IImagingStudy> => {
    const { data } = await axiosInstance.post<ApiResponse<IImagingStudy>>(`/pets/${petId}/health/imaging`, payload);
    if (!data.data) throw new Error('Failed to create imaging study');
    return data.data;
  },

  updateImaging: async (petId: string, studyId: string, payload: Partial<IImagingStudy>): Promise<IImagingStudy> => {
    const { data } = await axiosInstance.patch<ApiResponse<IImagingStudy>>(`/pets/${petId}/health/imaging/${studyId}`, payload);
    if (!data.data) throw new Error('Failed to update imaging study');
    return data.data;
  },

  // ─── Surgeries ───────────────────────────────────────────────
  getSurgeries: async (petId: string): Promise<ISurgery[]> => {
    const { data } = await axiosInstance.get<ApiResponse<ISurgery[]>>(`/pets/${petId}/health/surgeries`);
    return data.data || [];
  },

  createSurgery: async (petId: string, payload: Partial<ISurgery>): Promise<ISurgery> => {
    const { data } = await axiosInstance.post<ApiResponse<ISurgery>>(`/pets/${petId}/health/surgeries`, payload);
    if (!data.data) throw new Error('Failed to create surgery');
    return data.data;
  },

  updateSurgery: async (petId: string, surgeryId: string, payload: Partial<ISurgery>): Promise<ISurgery> => {
    const { data } = await axiosInstance.patch<ApiResponse<ISurgery>>(`/pets/${petId}/health/surgeries/${surgeryId}`, payload);
    if (!data.data) throw new Error('Failed to update surgery');
    return data.data;
  },

  deleteSurgery: async (petId: string, surgeryId: string): Promise<void> => {
    await axiosInstance.delete(`/pets/${petId}/health/surgeries/${surgeryId}`);
  },
};
