import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { growthApi } from '@/services/api/growthApi';
import { QUERY_KEYS } from '@petverse/shared-constants';
import type { IGrowthLog } from '@petverse/shared-types';

export function useGrowthLogs(petId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.PET_GROWTH(petId),
    queryFn: () => growthApi.getLogs(petId),
    enabled: !!petId,
  });
}

export function useGrowthAnalytics(petId: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.PET_GROWTH(petId), 'analytics'],
    queryFn: () => growthApi.getAnalytics(petId),
    enabled: !!petId,
  });
}

export function useCreateGrowthLog(petId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<IGrowthLog>) => growthApi.createLog(petId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PET_GROWTH(petId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PET(petId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HEALTH_DASHBOARD(petId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HEALTH_SUMMARY(petId) });
    },
  });
}

export function useDeleteGrowthLog(petId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (growthId: string) => growthApi.deleteLog(petId, growthId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PET_GROWTH(petId) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PET(petId) });
    },
  });
}
