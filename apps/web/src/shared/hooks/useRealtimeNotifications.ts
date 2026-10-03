import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/app/store/auth.store';
import { QUERY_KEYS } from '@petverse/shared-constants';
import { toast } from 'sonner';

export function useRealtimeNotifications() {
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Only connect when user is authenticated
    if (!user || !isAuthenticated) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
    // Use EventSource or fetch-based stream
    const url = `${apiBaseUrl}/notifications/stream`;

    try {
      // Standard EventSource with withCredentials cookie authentication
      const es = new EventSource(url, { withCredentials: true });
      eventSourceRef.current = es;

      es.addEventListener('notification', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          toast.info(payload.title || 'New Notification', {
            description: payload.body,
          });
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS });
        } catch {
          queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS });
        }
      });

      es.addEventListener('appointment_update', () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.APPOINTMENTS });
      });

      es.addEventListener('reminder_alert', () => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REMINDERS });
      });

      es.onerror = () => {
        // EventSource automatically retries connection
      };
    } catch {
      // Fallback gracefully
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [user, isAuthenticated, queryClient]);
}
