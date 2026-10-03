import { Router } from 'express';
import { automationController } from './automation.controller';
import { authenticate, requireRole } from '../../middlewares/auth.middleware';

const router = Router();

// Protect all automation routes (Admin only for now)
router.use(authenticate);
router.use(requireRole('admin'));

// Rules
router.get('/rules', automationController.getRules);
router.post('/rules', automationController.createRule);

// Workflows
router.get('/workflows', automationController.getWorkflows);
router.get('/executions', automationController.getWorkflowExecutions);

export const automationRoutes: Router = router;
