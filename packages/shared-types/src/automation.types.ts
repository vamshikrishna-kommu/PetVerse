import type { IAuditFields } from './index';
import type { DomainEventType } from './events.types';

export enum AutomationPriority {
  Low = 1,
  Normal = 5,
  High = 10,
  Critical = 99
}

export interface IAutomationAction {
  type: 'send_notification' | 'trigger_workflow' | 'schedule_reminder' | 'update_health_score' | 'webhook_call' | 'custom_script';
  config: Record<string, any>;
}

export interface IAutomationRule extends IAuditFields {
  _id: string;
  name: string;
  description?: string;
  triggerEvent: DomainEventType;
  
  // JSONLogic or custom DSL to evaluate if the rule should run based on the event payload/metadata
  conditions?: Record<string, any>;
  
  actions: IAutomationAction[];
  
  priority: AutomationPriority;
  isEnabled: boolean;
  maxRetries: number;
  
  createdBy: string;
  updatedBy?: string;
}

export enum WorkflowStatus {
  Pending = 'pending',
  Running = 'running',
  Completed = 'completed',
  Failed = 'failed',
  Suspended = 'suspended'
}

export interface IWorkflowStep {
  stepId: string;
  type: 'action' | 'delay' | 'condition' | 'parallel';
  config: Record<string, any>;
  nextStepId?: string; // undefined means end of workflow
}

export interface IWorkflowDefinition extends IAuditFields {
  _id: string;
  name: string;
  description?: string;
  steps: IWorkflowStep[];
  startStepId: string;
  isEnabled: boolean;
}

export interface IWorkflowExecution extends IAuditFields {
  _id: string;
  workflowId: string;
  triggerEventId?: string; // The event that caused this execution
  status: WorkflowStatus;
  currentStepId?: string;
  state: Record<string, any>; // Persistent state passed between steps
  history: Array<{
    stepId: string;
    startedAt: string;
    completedAt?: string;
    status: 'success' | 'failed' | 'skipped';
    error?: string;
  }>;
}
