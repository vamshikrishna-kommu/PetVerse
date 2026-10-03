import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { medicationApi } from '../../../services/api/medicationApi';
import { QUERY_KEYS } from '@petverse/shared-constants';


export function useMedicationDirectory() {
  return useQuery({
    queryKey: QUERY_KEYS.MEDICATIONS.DIRECTORY,
    queryFn: medicationApi.getDirectory,
  });
}

export function useMedicationCategories() {
  return useQuery({
    queryKey: QUERY_KEYS.MEDICATIONS.CATEGORIES,
    queryFn: medicationApi.getCategories,
  });
}

export function usePrescriptions(petId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.MEDICATIONS.BY_PET(petId),
    queryFn: () => medicationApi.getPrescriptions(petId),
    enabled: !!petId,
  });
}

export function useMedicationCourses(petId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.MEDICATIONS.COURSES(petId),
    queryFn: () => medicationApi.getCourses(petId),
    enabled: !!petId,
  });
}

export function useLogAdministration(petId: string, courseId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => medicationApi.logAdministration(petId, courseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MEDICATIONS.ADMINISTRATIONS(courseId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MEDICATIONS.COMPLIANCE(petId, courseId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MEDICATIONS.COURSES(petId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HEALTH_DASHBOARD(petId) });
    },
  });
}

export function useCreatePrescription(petId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => medicationApi.createPrescription(petId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MEDICATIONS.BY_PET(petId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MEDICATIONS.COURSES(petId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HEALTH_DASHBOARD(petId) });
    },
  });
}
