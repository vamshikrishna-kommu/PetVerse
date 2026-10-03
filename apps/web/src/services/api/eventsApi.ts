import api from '../../shared/lib/axios';
import type { IEventDocument } from '@petverse/shared-types';

export const eventsApi = {
  getFailedEvents: () => 
    api.get<any>('/events/failed').then((res: any) => res.data.data as IEventDocument[]),
    
  getByAggregate: (aggregateId: string) => 
    api.get<any>(`/events/aggregate/${aggregateId}`).then((res: any) => res.data.data as IEventDocument[]),
    
  dispatchEvent: (data: { aggregateId: string; aggregateType: string; eventType: string; payload: any }) => 
    api.post<any>('/events/dispatch', data).then((res: any) => res.data.data as IEventDocument),
};
