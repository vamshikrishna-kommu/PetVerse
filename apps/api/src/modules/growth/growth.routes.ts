import { Router } from 'express';
import { growthController } from './controllers/growth.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router: Router = Router({ mergeParams: true });

router.use(authenticate);

router.post('/', growthController.createLog);
router.get('/', growthController.getLogs);
router.get('/analytics', growthController.getAnalytics);
router.patch('/:growthId', growthController.updateLog);
router.delete('/:growthId', growthController.deleteLog);

export default router;
