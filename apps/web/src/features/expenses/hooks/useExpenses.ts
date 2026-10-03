import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseApi } from '@/services/api/expenseApi';
import type { IExpense } from '@petverse/shared-types';

export const expenseQueryKeys = {
  all: ['expenses'] as const,
  lists: () => [...expenseQueryKeys.all, 'list'] as const,
  list: (params: any) => [...expenseQueryKeys.lists(), params] as const,
  analytics: (year?: number) => [...expenseQueryKeys.all, 'analytics', year] as const,
};

export function useExpenses(params: any = {}) {
  return useQuery({
    queryKey: expenseQueryKeys.list(params),
    queryFn: () => expenseApi.list(params),
    placeholderData: (prev) => prev,
  });
}

export function useExpenseAnalytics(year?: number) {
  return useQuery({
    queryKey: expenseQueryKeys.analytics(year),
    queryFn: () => expenseApi.getAnalytics(year),
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<IExpense>) => expenseApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseQueryKeys.all });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<IExpense> }) => expenseApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseQueryKeys.all });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => expenseApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseQueryKeys.all });
    },
  });
}
