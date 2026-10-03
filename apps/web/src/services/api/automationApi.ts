import api from '../../shared/lib/axios';
import type { IAutomationRule, IWorkflowDefinition, IWorkflowExecution } from '@petverse/shared-types';

export const automationApi = {
  // Rules
  getRules: () => 
    api.get<any>('/automation/rules').then((res: any) => res.data.data as IAutomationRule[]),
    
  createRule: (data: Partial<IAutomationRule>) => 
    api.post<any>('/automation/rules', data).then((res: any) => res.data.data as IAutomationRule),
    
  // Workflows
  getWorkflows: () => 
    api.get<any>('/automation/workflows').then((res: any) => res.data.data as IWorkflowDefinition[]),
    
  getWorkflowExecutions: (status?: string) => 
    api.get<any>(`/automation/executions${status ? `?status=${status}` : ''}`).then((res: any) => res.data.data as IWorkflowExecution[]),
};
