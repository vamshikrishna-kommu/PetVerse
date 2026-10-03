import { Router } from 'express';
import { eventsController } from './events.controller';
import { authenticate, requireRole } from '../../middlewares/auth.middleware';

const router = Router();

// Protect all event routes
router.use(authenticate);

// Admin-only monitoring routes
router.get('/failed', requireRole('admin', 'vet'), eventsController.getFailedEvents);
router.post('/dispatch', requireRole('admin'), eventsController.dispatchEvent);

// User can view events for entities they have access to (ownership checked by higher level or generic)
router.get('/aggregate/:aggregateId', eventsController.getByAggregate);

export const eventRoutes: Router = router;
