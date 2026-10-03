import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { remindersApi } from '../../../services/api/remindersApi';
import type { IReminder } from '@petverse/shared-types';

export const REMINDER_KEYS = {
  all: ['reminders'] as const,
  mine: () => [...REMINDER_KEYS.all, 'mine'] as const,
};

export function useMyReminders() {
  return useQuery({
    queryKey: REMINDER_KEYS.mine(),
    queryFn: () => remindersApi.getMyReminders(),
  });
}

export function useCreateReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<IReminder>) => remindersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REMINDER_KEYS.all });
    },
  });
}

export function useSnoozeReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, hours }: { id: string; hours: number }) => remindersApi.snooze(id, hours),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REMINDER_KEYS.all });
    },
  });
}

export function useCompleteReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => remindersApi.complete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REMINDER_KEYS.all });
    },
  });
}
