import { useQuery } from '@tanstack/react-query';
import { userApi } from '@/services/api/userApi';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['user', 'dashboard-stats'],
    queryFn: () => userApi.getStats(),
    refetchInterval: 30000, // refresh stats every 30 seconds
  });
}
