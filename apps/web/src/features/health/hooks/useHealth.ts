import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { healthApi } from '../api/healthApi';
import { QUERY_KEYS } from '@petverse/shared-constants';
import type {
  IMedicalRecord,
  IVitalLog,
  ICondition,
  IAllergy,
  IPrescription,
  ILabReport,
  IImagingStudy,
  ISurgery,
} from '@petverse/shared-types';

export function useHealthDashboard(petId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.HEALTH_DASHBOARD(petId),
    queryFn: () => healthApi.getDashboard(petId),
    enabled: !!petId,
  });
}

export function useHealthSummary(petId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.HEALTH_SUMMARY(petId),
    queryFn: () => healthApi.getSummary(petId),
    enabled: !!petId,
  });
}

export function useHealthAnalytics(petId: string, periodDays = 365) {
  return useQuery({
    queryKey: [...QUERY_KEYS.HEALTH_ANALYTICS(petId), periodDays],
    queryFn: () => healthApi.getAnalytics(petId, periodDays),
    enabled: !!petId,
  });
}

// ─── Vitals ──────────────────────────────────────────────────
export function useVitals(petId: string, limit = 50) {
  return useQuery({
    queryKey: [...QUERY_KEYS.HEALTH_VITALS(petId), { limit }],
    queryFn: () => healthApi.getVitals(petId, { limit }),
    enabled: !!petId,
  });
}

export function useLogVital(petId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<IVitalLog>) => healthApi.logVital(petId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HEALTH_VITALS(petId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HEALTH_VITALS_LATEST(petId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HEALTH_DASHBOARD(petId) });
    },
  });
}

// ─── Conditions ──────────────────────────────────────────────
export function useConditions(petId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.HEALTH_CONDITIONS(petId),
    queryFn: () => healthApi.getConditions(petId),
    enabled: !!petId,
  });
}

export function useAddCondition(petId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<ICondition>) => healthApi.addCondition(petId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HEALTH_CONDITIONS(petId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HEALTH_DASHBOARD(petId) });
    },
  });
}

export function useUpdateCondition(petId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ condId, data }: { condId: string; data: Partial<ICondition> }) =>
      healthApi.updateCondition(petId, condId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HEALTH_CONDITIONS(petId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HEALTH_DASHBOARD(petId) });
    },
  });
}

// ─── Allergies ───────────────────────────────────────────────
export function useAllergies(petId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.HEALTH_ALLERGIES(petId),
    queryFn: () => healthApi.getAllergies(petId),
    enabled: !!petId,
  });
}

export function useAddAllergy(petId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<IAllergy>) => healthApi.addAllergy(petId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HEALTH_ALLERGIES(petId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HEALTH_DASHBOARD(petId) });
    },
  });
}

// ─── Prescriptions ───────────────────────────────────────────
export function usePrescriptions(petId: string, status?: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.HEALTH_PRESCRIPTIONS(petId), { status }],
    queryFn: () => healthApi.getPrescriptions(petId, status),
    enabled: !!petId,
  });
}

export function useCreatePrescription(petId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<IPrescription>) => healthApi.createPrescription(petId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HEALTH_PRESCRIPTIONS(petId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HEALTH_DASHBOARD(petId) });
    },
  });
}

// ─── Medical Records ─────────────────────────────────────────
export function useMedicalRecords(petId: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: [...QUERY_KEYS.HEALTH_RECORDS(petId), { page, limit }],
    queryFn: () => healthApi.getRecords(petId, { page, limit }),
    enabled: !!petId,
  });
}

// ─── Lab Reports ─────────────────────────────────────────────
export function useLabReports(petId: string, category?: string, page = 1) {
  return useQuery({
    queryKey: [...QUERY_KEYS.HEALTH_LABS(petId), { category, page }],
    queryFn: () => healthApi.getLabs(petId, { category, page }),
    enabled: !!petId,
  });
}

// ─── Imaging Studies ─────────────────────────────────────────
export function useImagingStudies(petId: string, page = 1) {
  return useQuery({
    queryKey: [...QUERY_KEYS.HEALTH_IMAGING(petId), { page }],
    queryFn: () => healthApi.getImaging(petId, { page }),
    enabled: !!petId,
  });
}

// ─── Surgeries ───────────────────────────────────────────────
export function useSurgeries(petId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.HEALTH_SURGERIES(petId),
    queryFn: () => healthApi.getSurgeries(petId),
    enabled: !!petId,
  });
}
