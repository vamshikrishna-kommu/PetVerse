import api from '../../shared/lib/axios';
import type { IReminder } from '@petverse/shared-types';

export const remindersApi = {
  getMyReminders: () => 
    api.get<any>('/reminders/my-reminders').then(res => res.data.data as IReminder[]),
    
  create: (data: Partial<IReminder>) =>
    api.post<any>('/reminders', data).then(res => res.data.data as IReminder),

  snooze: (id: string, hours: number) => 
    api.post<any>(`/reminders/${id}/snooze`, { hours }).then(res => res.data.data as IReminder),
    
  complete: (id: string) => 
    api.post<any>(`/reminders/${id}/complete`).then(res => res.data.data),
};
