import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/app/store/auth.store';
import { NOTIFICATION_KEYS } from './useNotifications';
import { toast } from 'sonner';

export function useRealtimeNotifications() {
  const queryClient = useQueryClient();
  const { accessToken, isAuthenticated } = useAuthStore();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    const apiBase = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    const streamUrl = `${apiBase}/notifications/stream?token=${encodeURIComponent(accessToken)}`;

    const es = new EventSource(streamUrl);
    eventSourceRef.current = es;

    es.addEventListener('notification', (event) => {
      try {
        const payload = JSON.parse(event.data);
        // Play notification toast
        toast.info(payload.title || 'New Notification', {
          description: payload.body,
        });

        // Invalidate feed and unread badge count instantly
        queryClient.invalidateQueries({ queryKey: NOTIFICATION_KEYS.all });
      } catch (err) {
        console.error('Failed to parse incoming real-time notification', err);
      }
    });

    es.addEventListener('error', () => {
      // Browsers will automatically attempt reconnect; close on fatal error to avoid polling storm
      if (es.readyState === EventSource.CLOSED) {
        es.close();
      }
    });

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [isAuthenticated, accessToken, queryClient]);
}
