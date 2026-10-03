import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vaccinationApi } from '../api/vaccinationApi';
import { QUERY_KEYS } from '@petverse/shared-constants';
import { toast } from 'sonner';

export function useVaccineDefinitions(species?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.VACCINE_DEFINITIONS(species),
    queryFn: () => vaccinationApi.getDefinitions(species),
  });
}

export function useVaccinationSchedule(petId: string, species: string, dob?: string) {
  return useQuery({
    queryKey: QUERY_KEYS.VACCINATION_SCHEDULE(petId),
    queryFn: () => vaccinationApi.getSchedule(petId, species, dob),
    enabled: !!petId && !!species,
  });
}

export function useVaccinationAnalytics(petId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.VACCINATION_ANALYTICS(petId),
    queryFn: () => vaccinationApi.getAnalytics(petId),
    enabled: !!petId,
  });
}

export function useVaccinationRecords(petId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.VACCINATION_RECORDS(petId),
    queryFn: () => vaccinationApi.getRecords(petId),
    enabled: !!petId,
  });
}

export function useRecordVaccination() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ petId, data }: { petId: string; data: any }) => vaccinationApi.recordVaccination(petId, data),
    onSuccess: (_, { petId }) => {
      toast.success('Vaccination recorded successfully');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VACCINATION_RECORDS(petId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VACCINATION_SCHEDULE(petId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VACCINATION_ANALYTICS(petId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HEALTH_DASHBOARD(petId) }); // Due to health score integration
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error?.message || 'Failed to record vaccination');
    },
  });
}

export function useVaccinationReactions(petId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.VACCINATION_REACTIONS(petId),
    queryFn: () => vaccinationApi.getReactions(petId),
    enabled: !!petId,
  });
}

export function useRecordReaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ petId, data }: { petId: string; data: any }) => vaccinationApi.recordReaction(petId, data),
    onSuccess: (_, { petId }) => {
      toast.success('Reaction recorded');
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VACCINATION_REACTIONS(petId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.VACCINATION_ANALYTICS(petId) });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error?.message || 'Failed to record reaction');
    },
  });
}

export function useVaccinationCertificates(petId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.VACCINATION_CERTIFICATES(petId),
    queryFn: () => vaccinationApi.getCertificates(petId),
    enabled: !!petId,
  });
}
