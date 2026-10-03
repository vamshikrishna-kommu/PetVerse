import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lostFoundApi } from '../api/lostFoundApi';

export function useLostFoundReports(params?: {
  type?: 'lost' | 'found';
  species?: string;
  city?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['lost-found', params],
    queryFn: () => lostFoundApi.getReports(params),
  });
}

export function useLostFoundReport(id?: string) {
  return useQuery({
    queryKey: ['lost-found', 'detail', id],
    queryFn: () => lostFoundApi.getReportById(id!),
    enabled: !!id,
  });
}

export function useCreateLostFoundReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: lostFoundApi.createReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lost-found'] });
      queryClient.invalidateQueries({ queryKey: ['pets'] });
    },
  });
}

export function useLostFoundMatches(id?: string) {
  return useQuery({
    queryKey: ['lost-found', 'matches', id],
    queryFn: () => lostFoundApi.findMatches(id!),
    enabled: !!id,
  });
}

export function useSendLostFoundInquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { message: string; contactInfo?: string } }) =>
      lostFoundApi.sendInquiry(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['lost-found', 'detail', id] });
    },
  });
}

export function useResolveLostFoundReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => lostFoundApi.resolveReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lost-found'] });
      queryClient.invalidateQueries({ queryKey: ['pets'] });
    },
  });
}
