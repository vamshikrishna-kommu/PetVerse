import { WorkflowDefinitionModel, WorkflowExecutionModel } from '../models/workflow.model';
import type { IWorkflowDefinition, IWorkflowExecution, WorkflowStatus } from '@petverse/shared-types';

export const workflowDefinitionRepository = {
  async findById(id: string): Promise<IWorkflowDefinition | null> {
    return WorkflowDefinitionModel.findOne({ _id: id, isDeleted: { $ne: true } }).exec();
  },
  
  async findAll(): Promise<IWorkflowDefinition[]> {
    return WorkflowDefinitionModel.find({ isDeleted: { $ne: true } }).exec();
  },

  async create(data: Partial<IWorkflowDefinition>): Promise<IWorkflowDefinition> {
    return new WorkflowDefinitionModel(data).save();
  }
};

export const workflowExecutionRepository = {
  async create(data: Partial<IWorkflowExecution>): Promise<IWorkflowExecution> {
    return new WorkflowExecutionModel(data).save();
  },

  async findById(id: string): Promise<IWorkflowExecution | null> {
    return WorkflowExecutionModel.findOne({ _id: id, isDeleted: { $ne: true } }).exec();
  },

  async updateStatus(id: string, status: WorkflowStatus, currentStepId?: string): Promise<IWorkflowExecution | null> {
    const update: any = { status };
    if (currentStepId) update.currentStepId = currentStepId;
    
    return WorkflowExecutionModel.findOneAndUpdate(
      { _id: id },
      { $set: update },
      { new: true }
    ).exec();
  },

  async appendHistory(id: string, historyEntry: IWorkflowExecution['history'][0]): Promise<IWorkflowExecution | null> {
    return WorkflowExecutionModel.findOneAndUpdate(
      { _id: id },
      { $push: { history: historyEntry } },
      { new: true }
    ).exec();
  },
  
  async findByStatus(status: WorkflowStatus): Promise<IWorkflowExecution[]> {
    return WorkflowExecutionModel.find({ status, isDeleted: { $ne: true } }).exec();
  }
};
