import api from '@/shared/lib/axios';

export interface SymptomAnalysisPayload {
  species: 'dog' | 'cat' | 'other';
  symptoms: string[];
  duration: 'hours' | 'days' | 'weeks' | 'chronic';
  severity: 'mild' | 'moderate' | 'severe';
  petAgeMonths?: number;
  additionalNotes?: string;
}

export interface SymptomAnalysisResponse {
  triageUrgency: 'EMERGENCY' | 'URGENT' | 'ROUTINE';
  summary: string;
  isEmergency: boolean;
  potentialConsiderations: string[];
  recommendedActions: string[];
  questionsForVeterinarian: string[];
  redFlags: string[];
  disclaimer: string;
  generatedBy: string;
}

export type DetectedSpecies = 'DOG' | 'CAT' | 'OTHER_ANIMAL' | 'PERSON' | 'OBJECT' | 'UNKNOWN' | 'dog' | 'cat';

export interface BreedScanPayload {
  species?: 'dog' | 'cat' | 'auto';
  imageUrl?: string;
  imageBase64?: string;
}

export interface BreedScanResponse {
  species: DetectedSpecies;
  isPetSupported: boolean;
  breed: string | null;
  primaryBreed?: string;
  confidence: number;
  uncertain?: boolean;
  explanation?: string;
  secondaryBreeds?: Array<{ breed: string; confidence: number }>;
  characteristics?: {
    energyLevel?: string;
    groomingNeeds?: string;
    temperament?: string[];
    typicalWeightRangeKg?: { min: number; max: number };
    lifeExpectancyYears?: { min: number; max: number };
    visualTraits?: string[];
  } | null;
  healthConsiderations?: string[];
  careTips?: string[];
  disclaimer: string;
  generatedBy: string;
}

export interface DietRecommendationPayload {
  species: 'dog' | 'cat';
  breed: string;
  ageMonths: number;
  weightKg: number;
  activityLevel: 'low' | 'moderate' | 'high';
  dietaryGoal: 'maintenance' | 'weight_loss' | 'weight_gain' | 'growth';
  allergies?: string[];
}

export interface DietRecommendationResponse {
  species: 'dog' | 'cat';
  targetDailyCaloriesKcal: number;
  mealsPerDay: number;
  caloriesPerMealKcal: number;
  approximateDailyFoodGrams: number;
  macronutrientTargets: {
    proteinPercent: number;
    fatPercent: number;
    fiberPercent: number;
  };
  hydrationGuidelineMl: number;
  feedingScheduleAdvice: string;
  safeTreats: string[];
  toxicFoodsToAvoid: string[];
  disclaimer: string;
  generatedBy: string;
}

export interface ChatAssistantPayload {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  petContext?: {
    name?: string;
    species?: string;
    breed?: string;
    ageMonths?: number;
    weightKg?: number;
    medicalConditions?: string[];
  };
}

export interface ChatAssistantResponse {
  message: string;
  isEmergency: boolean;
  detectedRedFlags: string[];
  suggestedActions: string[];
  disclaimer: string;
  generatedBy: string;
}

export const aiApi = {
  analyzeSymptoms: async (payload: SymptomAnalysisPayload): Promise<SymptomAnalysisResponse> => {
    const { data } = await api.post('/ai/symptom-analysis', payload);
    return data.data;
  },

  identifyBreed: async (payload: BreedScanPayload): Promise<BreedScanResponse> => {
    const { data } = await api.post('/ai/breed-scan', payload);
    return data.data;
  },

  calculateDiet: async (payload: DietRecommendationPayload): Promise<DietRecommendationResponse> => {
    const { data } = await api.post('/ai/diet-recommendations', payload);
    return data.data;
  },

  chat: async (payload: ChatAssistantPayload): Promise<ChatAssistantResponse> => {
    const { data } = await api.post('/ai/chat', payload);
    return data.data;
  },

  checkHealth: async () => {
    const { data } = await api.get('/ai/health');
    return data.data;
  },
};
