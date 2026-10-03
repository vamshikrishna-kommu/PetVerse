import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi } from '@/services/api/appointmentsApi';
import { QUERY_KEYS } from '@petverse/shared-constants';

export function useAppointments(status?: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.APPOINTMENTS, status || 'all'],
    queryFn: () => appointmentsApi.getUserAppointments(status),
  });
}

export function useAvailableSlots(clinicId?: string, date?: string) {
  return useQuery({
    queryKey: ['available-slots', clinicId, date],
    queryFn: () => appointmentsApi.getAvailableSlots(clinicId, date),
    enabled: !!date,
  });
}

export function useBookAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: appointmentsApi.bookAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.APPOINTMENTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REMINDERS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS });
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      appointmentsApi.cancelAppointment(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.APPOINTMENTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS });
    },
  });
}

export function useCompleteAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => appointmentsApi.completeAppointment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.APPOINTMENTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS });
    },
  });
}

export function useRescheduleAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { appointmentDate: string; startTime: string } }) =>
      appointmentsApi.rescheduleAppointment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.APPOINTMENTS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.REMINDERS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS });
    },
  });
}
