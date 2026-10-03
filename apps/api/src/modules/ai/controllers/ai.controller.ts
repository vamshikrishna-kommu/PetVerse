import type { Request, Response } from 'express';
import { aiService } from '../services/ai.service';
import { apiResponse } from '../../../shared/utils/apiResponse';
import { asyncHandler } from '../../../middlewares/error.middleware';
import type {
  SymptomAnalysisInput,
  BreedScanInput,
  DietRecommendationInput,
  ChatAssistantInput,
} from '../schemas/ai.schemas';

export const aiController = {
  analyzeSymptoms: asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as SymptomAnalysisInput;
    const result = await aiService.analyzeSymptoms(input);
    apiResponse.success(res, result);
  }),

  identifyBreed: asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as BreedScanInput;
    const result = await aiService.identifyBreed(input);
    apiResponse.success(res, result);
  }),

  calculateDiet: asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as DietRecommendationInput;
    const result = await aiService.calculateDietRecommendations(input);
    apiResponse.success(res, result);
  }),

  chat: asyncHandler(async (req: Request, res: Response) => {
    const input = req.body as ChatAssistantInput;
    const result = await aiService.chatWithAssistant(input);
    apiResponse.success(res, result);
  }),

  checkHealth: asyncHandler(async (_req: Request, res: Response) => {
    apiResponse.success(res, {
      status: 'operational',
      features: ['symptom_analysis', 'breed_scan', 'diet_recommendations', 'ai_assistant_chat'],
      engine: 'petverse_clinical_ai_v1',
    });
  }),
};
