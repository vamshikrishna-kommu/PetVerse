import { Request, Response, NextFunction } from 'express';
import { automationRuleRepository } from './repositories/rule.repository';
import { workflowDefinitionRepository, workflowExecutionRepository } from './repositories/workflow.repository';
import { apiResponse } from '../../shared/utils/apiResponse';
import { AppError } from '../../shared/errors/AppError';
import { WorkflowStatus } from '@petverse/shared-types';

export const automationController = {
  // ─── Rules ──────────────────────────────────────────────────────────
  async getRules(req: Request, res: Response, next: NextFunction) {
    try {
      const rules = await automationRuleRepository.findAll();
      apiResponse.success(res, rules);
    } catch (error) {
      next(error);
    }
  },

  async createRule(req: Request, res: Response, next: NextFunction) {
    try {
      const data = { ...req.body, createdBy: req.user?.userId || 'system' };
      const rule = await automationRuleRepository.create(data);
      apiResponse.created(res, rule);
    } catch (error) {
      next(error);
    }
  },

  // ─── Workflows ──────────────────────────────────────────────────────
  async getWorkflows(req: Request, res: Response, next: NextFunction) {
    try {
      const workflows = await workflowDefinitionRepository.findAll();
      apiResponse.success(res, workflows);
    } catch (error) {
      next(error);
    }
  },

  async getWorkflowExecutions(req: Request, res: Response, next: NextFunction) {
    try {
      // In a real app, we'd paginate. Just get failed for now as an example.
      const status = req.query.status as WorkflowStatus || WorkflowStatus.Failed;
      const executions = await workflowExecutionRepository.findByStatus(status);
      apiResponse.success(res, executions);
    } catch (error) {
      next(error);
    }
  }
};
