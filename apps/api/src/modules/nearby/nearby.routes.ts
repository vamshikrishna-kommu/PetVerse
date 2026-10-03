import { Router } from 'express';
import { nearbyController } from './controllers/nearby.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { addReviewSchema } from '../../shared/validation/schemas';

const router: Router = Router();

// Public routes for browsing nearby services
router.get('/services', nearbyController.getNearbyServices);
router.get('/services/:id', nearbyController.getClinicById);
router.get('/services/:id/reviews', nearbyController.getClinicReviews);

// Protected routes for adding reviews
router.post('/services/:id/reviews', authenticate, validate(addReviewSchema), nearbyController.addReview);

export default router;

