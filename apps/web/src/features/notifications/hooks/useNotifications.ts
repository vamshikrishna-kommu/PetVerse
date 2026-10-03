import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../../../services/api/notificationsApi';

export const NOTIFICATION_KEYS = {
  all: ['notifications'] as const,
  feed: () => [...NOTIFICATION_KEYS.all, 'feed'] as const,
  unreadCount: () => [...NOTIFICATION_KEYS.all, 'unreadCount'] as const,
};

export function useNotificationFeed() {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.feed(),
    queryFn: () => notificationsApi.getFeed(),
    refetchInterval: 30000, // Poll every 30s as fallback to sockets
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: NOTIFICATION_KEYS.unreadCount(),
    queryFn: () => notificationsApi.getUnreadCount(),
    refetchInterval: 30000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
    },
  });
}
