import api from '../../shared/lib/axios';
import type { 
  IMedication, 
  IMedicationCategory, 
  IPrescription, 
  IMedicationCourse, 
  IMedicationAdministration, 
  IMedicationCompliance 
} from '@petverse/shared-types';

export const medicationApi = {
  getCategories: () => api.get<any>('/medications/categories').then((res: any) => res.data.data as IMedicationCategory[]),
  
  getDirectory: () => api.get<any>('/medications/directory').then((res: any) => res.data.data as IMedication[]),
  
  searchDirectory: (query: string) => api.get<any>(`/medications/directory/search?q=${query}`).then((res: any) => res.data.data as IMedication[]),
  
  // ─── Prescriptions ───────────────────────────────────────────
  getPrescriptions: (petId: string) => api.get<any>(`/medications/pets/${petId}/prescriptions`).then((res: any) => res.data.data as IPrescription[]),
  
  createPrescription: (petId: string, data: any) => api.post<any>(`/medications/pets/${petId}/prescriptions`, data).then((res: any) => res.data.data as IPrescription),
  
  // ─── Courses & Compliance ────────────────────────────────────
  getCourses: (petId: string) => api.get<any>(`/medications/pets/${petId}/courses`).then((res: any) => res.data.data as IMedicationCourse[]),
  
  getCompliance: (petId: string, courseId: string) => api.get<any>(`/medications/pets/${petId}/courses/${courseId}/compliance`).then((res: any) => res.data.data as IMedicationCompliance),
  
  // ─── Administrations ─────────────────────────────────────────
  getAdministrations: (petId: string, courseId: string) => api.get<any>(`/medications/pets/${petId}/courses/${courseId}/administrations`).then((res: any) => res.data.data as IMedicationAdministration[]),
  
  logAdministration: (petId: string, courseId: string, data: any) => api.post<any>(`/medications/pets/${petId}/courses/${courseId}/administrations`, data).then((res: any) => res.data.data as IMedicationAdministration),
};
