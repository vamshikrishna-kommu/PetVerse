import { z } from 'zod';

export const symptomAnalysisSchema = z.object({
  species: z.enum(['dog', 'cat', 'other']).default('dog'),
  symptoms: z.array(z.string().min(2).max(100)).min(1, 'Please select or describe at least one symptom'),
  duration: z.enum(['hours', 'days', 'weeks', 'chronic']).default('days'),
  severity: z.enum(['mild', 'moderate', 'severe']).default('moderate'),
  petAgeMonths: z.number().positive().max(360).optional(),
  additionalNotes: z.string().max(1000).optional(),
});

export const breedScanSchema = z.object({
  species: z.enum(['dog', 'cat']).default('dog'),
  imageUrl: z.string().url().optional(),
  imageBase64: z.string().optional(),
}).refine((data) => data.imageUrl || data.imageBase64, {
  message: 'Either an image URL or image base64 data must be provided',
  path: ['imageUrl'],
});

export const dietRecommendationSchema = z.object({
  species: z.enum(['dog', 'cat']).default('dog'),
  breed: z.string().min(2).max(100).default('Mixed Breed'),
  ageMonths: z.number().positive().max(360),
  weightKg: z.number().positive().max(120),
  activityLevel: z.enum(['low', 'moderate', 'high']).default('moderate'),
  dietaryGoal: z.enum(['maintenance', 'weight_loss', 'weight_gain', 'growth']).default('maintenance'),
  allergies: z.array(z.string().max(50)).optional(),
});

export const chatAssistantSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string().min(1).max(3000),
      })
    )
    .min(1, 'At least one message is required'),
  petContext: z
    .object({
      name: z.string().optional(),
      species: z.string().optional(),
      breed: z.string().optional(),
      ageMonths: z.number().optional(),
      weightKg: z.number().optional(),
      medicalConditions: z.array(z.string()).optional(),
    })
    .optional(),
});

export type SymptomAnalysisInput = z.infer<typeof symptomAnalysisSchema>;
export type BreedScanInput = z.infer<typeof breedScanSchema>;
export type DietRecommendationInput = z.infer<typeof dietRecommendationSchema>;
export type ChatAssistantInput = z.infer<typeof chatAssistantSchema>;
