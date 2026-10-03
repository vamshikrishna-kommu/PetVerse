import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { automationApi } from '../../../services/api/automationApi';
import { eventsApi } from '../../../services/api/eventsApi';
import type { DomainEventType } from '@petverse/shared-types';

const KEYS = {
  RULES: ['automation', 'rules'],
  WORKFLOWS: ['automation', 'workflows'],
  EXECUTIONS: (status?: string) => ['automation', 'executions', status],
  FAILED_EVENTS: ['events', 'failed'],
  AGGREGATE_EVENTS: (id: string) => ['events', 'aggregate', id],
};

// Automation Hooks
export function useAutomationRules() {
  return useQuery({
    queryKey: KEYS.RULES,
    queryFn: () => automationApi.getRules(),
  });
}

export function useCreateAutomationRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => automationApi.createRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.RULES });
    },
  });
}

export function useWorkflowExecutions(status?: string) {
  return useQuery({
    queryKey: KEYS.EXECUTIONS(status),
    queryFn: () => automationApi.getWorkflowExecutions(status),
  });
}

// Events Hooks
export function useFailedEvents() {
  return useQuery({
    queryKey: KEYS.FAILED_EVENTS,
    queryFn: () => eventsApi.getFailedEvents(),
  });
}

export function useDispatchEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { aggregateId: string; aggregateType: string; eventType: string; payload: any }) => eventsApi.dispatchEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    }
  });
}
