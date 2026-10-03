import api from '../../shared/lib/axios';
import type { IExpense, IExpenseAnalytics } from '@petverse/shared-types';

export const expenseApi = {
  list: (params?: { petId?: string; category?: string; startDate?: string; endDate?: string; search?: string; page?: number; limit?: number }) =>
    api.get<{ data: { expenses: IExpense[]; total: number; page: number; totalPages: number } }>('/expenses', { params }).then((res) => res.data.data),

  getAnalytics: (year?: number) =>
    api.get<{ data: IExpenseAnalytics }>('/expenses/analytics', { params: { year } }).then((res) => res.data.data),

  create: (data: Partial<IExpense>) =>
    api.post<{ data: IExpense }>('/expenses', data).then((res) => res.data.data),

  update: (id: string, data: Partial<IExpense>) =>
    api.put<{ data: IExpense }>(`/expenses/${id}`, data).then((res) => res.data.data),

  delete: (id: string) =>
    api.delete(`/expenses/${id}`).then((res) => res.data),

  exportCsv: async () => {
    const response = await api.get('/expenses/export', { responseType: 'blob' });
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `petverse_expenses_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
