import { Router } from 'express';
import { aiController } from './controllers/ai.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  symptomAnalysisSchema,
  breedScanSchema,
  dietRecommendationSchema,
  chatAssistantSchema,
} from './schemas/ai.schemas';

const router = Router();

// Public/health endpoint
router.get('/health', aiController.checkHealth);

// Protected AI capabilities (requires authenticated user)
router.use(authenticate);

router.post('/symptom-analysis', validate(symptomAnalysisSchema), aiController.analyzeSymptoms);
router.post('/breed-scan', validate(breedScanSchema), aiController.identifyBreed);
router.post('/diet-recommendations', validate(dietRecommendationSchema), aiController.calculateDiet);
router.post('/chat', validate(chatAssistantSchema), aiController.chat);

export const aiRoutes: Router = router;
