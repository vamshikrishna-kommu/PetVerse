import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { nearbyApi, type NearbyQueryParams } from '@/services/api/nearbyApi';

export function useNearbyServices(params: NearbyQueryParams = {}) {
  return useQuery({
    queryKey: ['nearby-services', params],
    queryFn: () => nearbyApi.getNearbyServices(params),
  });
}

export function useClinic(id: string) {
  return useQuery({
    queryKey: ['clinic', id],
    queryFn: () => nearbyApi.getClinicById(id),
    enabled: !!id,
  });
}

export function useClinicReviews(id: string) {
  return useQuery({
    queryKey: ['clinic-reviews', id],
    queryFn: () => nearbyApi.getClinicReviews(id),
    enabled: !!id,
  });
}

export function useAddReview(clinicId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { rating: number; comment: string }) =>
      nearbyApi.addReview(clinicId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinic', clinicId] });
      queryClient.invalidateQueries({ queryKey: ['clinic-reviews', clinicId] });
      queryClient.invalidateQueries({ queryKey: ['nearby-services'] });
    },
  });
}
