import api from '../../shared/lib/axios';
import type { INotification } from '@petverse/shared-types';

export const notificationsApi = {
  getFeed: () => 
    api.get<any>('/notifications/feed').then(res => res.data.data as INotification[]),
    
  getUnreadCount: () => 
    api.get<any>('/notifications/unread-count').then(res => res.data.data.count as number),
    
  markAsRead: (id: string) => 
    api.patch<any>(`/notifications/${id}/read`).then(res => res.data.data as INotification),
    
  markAllAsRead: () => 
    api.patch<any>('/notifications/read-all').then(res => res.data.data),
};
