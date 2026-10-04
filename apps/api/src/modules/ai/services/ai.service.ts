import { env, isConfiguredCredential } from '../../../config/env';
import { logger } from '../../../shared/utils/logger';
import { geminiClient } from './gemini.client';
import type {
  SymptomAnalysisInput,
  BreedScanInput,
  DietRecommendationInput,
  ChatAssistantInput,
} from '../schemas/ai.schemas';

export interface SymptomAnalysisResult {
  triageUrgency: 'EMERGENCY' | 'URGENT' | 'ROUTINE';
  summary: string;
  isEmergency: boolean;
  potentialConsiderations: string[];
  recommendedActions: string[];
  questionsForVeterinarian: string[];
  redFlags: string[];
  disclaimer: string;
  generatedBy: 'external_ai_model' | 'clinical_rule_engine';
}

export interface BreedScanResult {
  species: 'dog' | 'cat';
  primaryBreed: string;
  confidence: number;
  secondaryBreeds: Array<{ breed: string; confidence: number }>;
  characteristics: {
    energyLevel: string;
    groomingNeeds: string;
    temperament: string[];
    typicalWeightRangeKg: { min: number; max: number };
    lifeExpectancyYears: { min: number; max: number };
  };
  healthConsiderations: string[];
  careTips: string[];
  disclaimer: string;
  generatedBy: 'external_ai_model' | 'visual_feature_engine';
}

export interface DietRecommendationResult {
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
  generatedBy: 'external_ai_model' | 'veterinary_nutrition_calculator';
}

export interface ChatAssistantResult {
  message: string;
  isEmergency: boolean;
  detectedRedFlags: string[];
  suggestedActions: string[];
  disclaimer: string;
  generatedBy: 'external_ai_model' | 'clinical_rule_engine';
}

const MEDICAL_DISCLAIMER =
  'IMPORTANT VETERINARY DISCLAIMER: This assessment is an AI-assisted informational guide and DOES NOT constitute a definitive veterinary diagnosis, prescription, or clinical treatment plan. If your pet exhibits severe symptoms or distress, immediately contact a licensed veterinarian or emergency veterinary clinic.';

// ─── Startup Diagnostic ─────────────────────────────────────

(function logAIEngineStatus() {
  const geminiConfigured = isConfiguredCredential(env.GEMINI_API_KEY);
  if (geminiConfigured) {
    logger.info('[AIService] Gemini AI engine: CONFIGURED — live inference enabled');
  } else {
    logger.warn(
      '[AIService] Gemini AI engine: NOT CONFIGURED — GEMINI_API_KEY is missing or is a placeholder. ' +
        'All AI features will fall back to rule-based engines. Set a real GEMINI_API_KEY in apps/api/.env to enable live AI.'
    );
  }
})();

export const aiService = {
  /**
   * Analyze pet symptoms with clinical triage logic.
   * If the external microservice is unreachable, falls back to a certified rule-based triage matrix.
   */
  async analyzeSymptoms(input: SymptomAnalysisInput): Promise<SymptomAnalysisResult> {
    const startTime = Date.now();
    logger.info('[AIService] Analyzing symptoms', {
      geminiConfigured: isConfiguredCredential(env.GEMINI_API_KEY),
      species: input.species,
      symptomsCount: input.symptoms.length,
      severity: input.severity,
      duration: input.duration,
    });

    try {
      // 1. Attempt call to Gemini AI Client if configured
      const geminiResult = await geminiClient.analyzeSymptoms(input);
      if (geminiResult) {
        return {
          triageUrgency: geminiResult.triageUrgency || 'ROUTINE',
          summary: geminiResult.summary || 'AI Clinical assessment completed.',
          isEmergency: Boolean(geminiResult.isEmergency),
          potentialConsiderations: geminiResult.potentialConsiderations || [],
          recommendedActions: geminiResult.recommendedActions || [],
          questionsForVeterinarian: geminiResult.questionsForVeterinarian || [],
          redFlags: geminiResult.redFlags || [],
          disclaimer: MEDICAL_DISCLAIMER,
          generatedBy: 'external_ai_model',
        };
      }

      // 2. Attempt call to external AI microservice with timeout
      if (env.AI_SERVICE_URL && env.AI_SERVICE_URL !== 'http://localhost:8000') {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);

        const response = await fetch(`${env.AI_SERVICE_URL}/v1/symptom-analysis`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(env.AI_SERVICE_INTERNAL_KEY ? { 'X-Internal-Key': env.AI_SERVICE_INTERNAL_KEY } : {}),
          },
          body: JSON.stringify(input),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (response.ok) {
          const data = (await response.json()) as Partial<SymptomAnalysisResult>;
          return {
            triageUrgency: data.triageUrgency || 'ROUTINE',
            summary: data.summary || 'AI Assessment completed.',
            isEmergency: data.isEmergency || false,
            potentialConsiderations: data.potentialConsiderations || [],
            recommendedActions: data.recommendedActions || [],
            questionsForVeterinarian: data.questionsForVeterinarian || [],
            redFlags: data.redFlags || [],
            disclaimer: MEDICAL_DISCLAIMER,
            generatedBy: 'external_ai_model',
          };
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.warn('[AIService] External AI model unavailable, engaging clinical fallback engine', {
        latencyMs: Date.now() - startTime,
        error: message,
      });
    }

    // Heuristic Clinical Triage Fallback Engine
    return this._clinicalTriageFallback(input);
  },

  /**
   * Breed identification from visual features.
   * Falls back to visual pattern recognizer if microservice is offline.
   */
  async identifyBreed(input: BreedScanInput): Promise<BreedScanResult> {
    const startTime = Date.now();
    logger.info('[AIService] Initiating breed scan', {
      geminiConfigured: isConfiguredCredential(env.GEMINI_API_KEY),
      species: input.species,
      hasImageUrl: Boolean(input.imageUrl),
      hasImageBase64: Boolean(input.imageBase64),
    });

    try {
      // 1. Attempt call to Gemini AI Client
      const geminiResult = await geminiClient.identifyBreed(input);
      if (geminiResult && geminiResult.primaryBreed) {
        return {
          species: input.species,
          primaryBreed: geminiResult.primaryBreed,
          confidence: geminiResult.confidence || 88,
          secondaryBreeds: geminiResult.secondaryBreeds || [],
          characteristics: geminiResult.characteristics || {
            energyLevel: 'Moderate',
            groomingNeeds: 'Moderate',
            temperament: ['Alert', 'Friendly'],
            typicalWeightRangeKg: { min: 10, max: 25 },
            lifeExpectancyYears: { min: 11, max: 14 },
          },
          healthConsiderations: geminiResult.healthConsiderations || [],
          careTips: geminiResult.careTips || [],
          disclaimer:
            'Breed prediction is estimated by visual model analysis. DNA genetic tests provide 100% definitive heritage.',
          generatedBy: 'external_ai_model',
        };
      }

      // 2. Attempt call to external microservice
      if (env.AI_SERVICE_URL && env.AI_SERVICE_URL !== 'http://localhost:8000') {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(`${env.AI_SERVICE_URL}/v1/breed-scan`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(env.AI_SERVICE_INTERNAL_KEY ? { 'X-Internal-Key': env.AI_SERVICE_INTERNAL_KEY } : {}),
          },
          body: JSON.stringify(input),
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (response.ok) {
          const data = (await response.json()) as Partial<BreedScanResult>;
          return {
            ...data,
            disclaimer:
              'Breed prediction is estimated by visual model analysis. DNA genetic tests provide 100% definitive heritage.',
            generatedBy: 'external_ai_model',
          } as BreedScanResult;
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.warn('[AIService] Breed scan failed — Gemini unavailable and no external service configured', {
        latencyMs: Date.now() - startTime,
        error: message,
      });
    }

    return this._breedFeatureFallback(input);
  },

  /**
   * Conversational Pet Care AI Assistant.
   * Answers queries with strict veterinary guardrails and emergency red-flag detection.
   */
  async chatWithAssistant(input: ChatAssistantInput): Promise<ChatAssistantResult> {
    const redFlagKeywords = [
      'breathing',
      'breath',
      'seizure',
      'convulsion',
      'poison',
      'toxic',
      'pale gums',
      'unconscious',
      'collapse',
      'cannot urinate',
      'bloat',
      'swollen abdomen',
      'bleeding',
      'severe pain',
      'choking',
    ];

    const lastUserMessage = input.messages
      .filter((m) => m.role === 'user')
      .slice(-1)[0]?.content || '';
    const lowerMessage = lastUserMessage.toLowerCase();
    const detectedRedFlags = redFlagKeywords.filter((rf) => lowerMessage.includes(rf));
    const isEmergency = detectedRedFlags.length > 0;

    try {
      const geminiText = await geminiClient.chatWithAssistant(input);
      if (geminiText) {
        return {
          message: geminiText,
          isEmergency,
          detectedRedFlags,
          suggestedActions: isEmergency
            ? [
                'Immediately take your pet to the nearest 24/7 Veterinary Emergency Hospital',
                'Avoid administering human medications or inducing vomiting without direct toxicologist guidance',
                'Keep pet calm and minimize movement during transport',
              ]
            : [
                'Monitor pet energy, hydration, and appetite',
                'Schedule a routine or urgent clinic checkup if signs do not improve within 24-48 hours',
              ],
          disclaimer: MEDICAL_DISCLAIMER,
          generatedBy: 'external_ai_model',
        };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.warn('[AIService] Gemini chat failed, using clinical fallback engine', { error: message });
    }

    return this._chatAssistantFallback(input, detectedRedFlags, isEmergency);
  },

  /**
   * Veterinary Nutrition and Calorie Calculator
   */
  async calculateDietRecommendations(input: DietRecommendationInput): Promise<DietRecommendationResult> {
    logger.info('[AIService] Calculating diet plan', {
      species: input.species,
      weightKg: input.weightKg,
      ageMonths: input.ageMonths,
      goal: input.dietaryGoal,
    });

    // Resting Energy Requirement (RER) = 70 * (body weight in kg)^0.75
    const rer = 70 * Math.pow(input.weightKg, 0.75);

    // Multiplier based on species, life stage, and activity
    let multiplier = 1.6; // default neutered adult dog
    if (input.species === 'cat') {
      multiplier = 1.2;
    }

    if (input.ageMonths < 12) {
      multiplier = input.species === 'dog' ? 2.5 : 2.0; // Puppy / Kitten growth
    } else if (input.dietaryGoal === 'weight_loss') {
      multiplier = input.species === 'dog' ? 1.0 : 0.8;
    } else if (input.dietaryGoal === 'weight_gain') {
      multiplier = input.species === 'dog' ? 1.8 : 1.4;
    } else if (input.activityLevel === 'high') {
      multiplier += 0.4;
    } else if (input.activityLevel === 'low') {
      multiplier -= 0.2;
    }

    const dailyCalories = Math.round(rer * multiplier);
    const meals = input.ageMonths < 6 ? 3 : 2;
    const caloriesPerMeal = Math.round(dailyCalories / meals);

    // Standard commercial kibble is approx. 350-400 kcal per 100g (~3.75 kcal/g)
    const approximateDailyGrams = Math.round(dailyCalories / 3.75);

    // Hydration: ~50-60ml per kg body weight per day
    const hydrationMl = Math.round(input.weightKg * 55);

    const isCat = input.species === 'cat';

    return {
      species: input.species,
      targetDailyCaloriesKcal: dailyCalories,
      mealsPerDay: meals,
      caloriesPerMealKcal: caloriesPerMeal,
      approximateDailyFoodGrams: approximateDailyGrams,
      macronutrientTargets: isCat
        ? { proteinPercent: 40, fatPercent: 35, fiberPercent: 5 } // Obligate carnivore
        : { proteinPercent: 26, fatPercent: 16, fiberPercent: 6 },
      hydrationGuidelineMl: hydrationMl,
      feedingScheduleAdvice: `Feed ${meals} measured portions per day at consistent times (e.g., 8:00 AM and 6:00 PM). Ensure clean fresh water is always accessible.`,
      safeTreats: isCat
        ? ['Cooked chicken breast (unseasoned)', 'Freeze-dried salmon', 'Cat grass']
        : ['Carrot sticks', 'Apple slices (no seeds)', 'Plain pumpkin puree', 'Blueberries'],
      toxicFoodsToAvoid: isCat
        ? [
            'Lilies (deadly nephrotoxic to cats)',
            'Onions, Garlic & Chives',
            'Chocolate & Caffeine',
            'Grapes & Raisins',
            'Xylitol (artificial sweetener)',
            'Raw bread dough',
          ]
        : [
            'Chocolate & Caffeine',
            'Grapes & Raisins',
            'Onions, Garlic & Chives',
            'Xylitol (artificial sweetener)',
            'Macadamia nuts',
            'Cooked animal bones (splinter hazard)',
          ],
      disclaimer: MEDICAL_DISCLAIMER,
      generatedBy: 'veterinary_nutrition_calculator',
    };
  },

  // ─── Internal Clinical Fallback Algorithms ─────────────────

  _clinicalTriageFallback(input: SymptomAnalysisInput): SymptomAnalysisResult {
    const redFlagKeywords = [
      'breathing',
      'breath',
      'seizure',
      'convulsion',
      'poison',
      'toxic',
      'pale gums',
      'unconscious',
      'collapse',
      'cannot urinate',
      'bloat',
      'swollen abdomen',
      'bleeding',
      'severe pain',
      'choking',
    ];

    const inputLower = (input.symptoms.join(' ') + ' ' + (input.additionalNotes || '')).toLowerCase();
    const detectedRedFlags = redFlagKeywords.filter((rf) => inputLower.includes(rf));

    const isEmergency = detectedRedFlags.length > 0 || input.severity === 'severe';

    if (isEmergency) {
      return {
        triageUrgency: 'EMERGENCY',
        isEmergency: true,
        summary: `POTENTIAL CRITICAL EMERGENCY DETECTED: Symptoms matching ${detectedRedFlags.length > 0 ? detectedRedFlags.join(', ') : 'severe distress'} require immediate emergency veterinary evaluation.`,
        potentialConsiderations: [
          'Acute systemic distress requiring immediate stabilization',
          'Potential toxic exposure or respiratory compromise',
          'Underlying trauma or acute abdominal condition',
        ],
        recommendedActions: [
          'Transport your pet immediately to the nearest 24/7 Veterinary Emergency Hospital',
          'Keep your pet calm, warm, and minimize unnecessary movement during transport',
          'Do NOT administer human medications (e.g. ibuprofen, acetaminophen, aspirin are toxic)',
          'Bring any suspected packaging, plants, or substances your pet may have ingested',
        ],
        questionsForVeterinarian: [
          'What emergency triage interventions are immediately necessary?',
          'Is diagnostic imaging (X-Ray/Ultrasound) or toxicological blood work indicated?',
        ],
        redFlags: detectedRedFlags.length > 0 ? detectedRedFlags : ['Severe distress', 'Pain posture', 'Lethargy'],
        disclaimer: MEDICAL_DISCLAIMER,
        generatedBy: 'clinical_rule_engine',
      };
    }

    if (input.severity === 'moderate' || input.duration === 'weeks') {
      return {
        triageUrgency: 'URGENT',
        isEmergency: false,
        summary: `Clinical signs indicate moderate discomfort that should be evaluated by a veterinarian within 24 to 48 hours.`,
        potentialConsiderations: [
          'Gastrointestinal irritation, dietary indiscretion, or mild intolerance',
          'Localized dermatological, musculoskeletal, or ear canal inflammation',
          'Early-stage infection or seasonal environmental allergies',
        ],
        recommendedActions: [
          'Schedule an appointment with your veterinarian for full clinical examination',
          'Monitor appetite, water intake, stool quality, and body temperature',
          'Keep a diary of symptom frequency and note any changes in behavior',
        ],
        questionsForVeterinarian: [
          'Could this be related to a recent dietary change or allergen?',
          'Are fecal or blood lab panels recommended to isolate the cause?',
        ],
        redFlags: ['Persistent vomiting exceeding 24 hours', 'Refusal to drink water', 'Marked behavioral change'],
        disclaimer: MEDICAL_DISCLAIMER,
        generatedBy: 'clinical_rule_engine',
      };
    }

    return {
      triageUrgency: 'ROUTINE',
      isEmergency: false,
      summary: `Mild transient symptoms detected. Monitor your pet closely; consult your veterinarian if symptoms persist past 48 hours.`,
      potentialConsiderations: [
        'Mild transient digestive upset or minor stress reaction',
        'Normal environmental reaction or minor physical fatigue',
      ],
      recommendedActions: [
        'Offer small amounts of fresh water and a bland diet if stomach upset occurs',
        'Ensure a quiet, comfortable resting space with minimal stressors',
        'If symptoms worsen or fail to resolve within 48 hours, book a routine checkup',
      ],
      questionsForVeterinarian: [
        'Is preventive wellness screening appropriate during the next scheduled visit?',
      ],
      redFlags: ['Sudden lethargy', 'Onset of fever or shivering', 'Loss of coordination'],
      disclaimer: MEDICAL_DISCLAIMER,
      generatedBy: 'clinical_rule_engine',
    };
  },

  /**
   * Breed scan fallback — returned only when Gemini is unavailable.
   * Does NOT fabricate a specific breed; instead surfaces a transparent
   * service-unavailable message so the UI can prompt the user to try again.
   */
  _breedFeatureFallback(input: BreedScanInput): BreedScanResult {
    logger.warn('[AIService] Returning breed-scan service-unavailable fallback', {
      species: input.species,
      geminiConfigured: isConfiguredCredential(env.GEMINI_API_KEY),
    });

    return {
      species: input.species,
      primaryBreed: 'Unable to identify — AI service unavailable',
      confidence: 0,
      secondaryBreeds: [],
      characteristics: {
        energyLevel: 'Unknown',
        groomingNeeds: 'Unknown',
        temperament: [],
        typicalWeightRangeKg: { min: 0, max: 0 },
        lifeExpectancyYears: { min: 0, max: 0 },
      },
      healthConsiderations: [
        'Breed identification requires the Gemini AI engine to be configured.',
        'Please ensure GEMINI_API_KEY is set to a valid Google Gemini API key in the server environment.',
      ],
      careTips: [
        'Once the AI engine is configured, upload a clear front-facing photo of your pet for best results.',
      ],
      disclaimer:
        'Breed identification is powered by Gemini vision AI. The service is currently unavailable because the AI engine is not configured. ' +
        'No breed prediction can be made without a valid API key. DNA genetic tests provide 100% definitive heritage.',
      generatedBy: 'visual_feature_engine',
    };
  },

  _chatAssistantFallback(
    input: ChatAssistantInput,
    detectedRedFlags: string[],
    isEmergency: boolean
  ): ChatAssistantResult {
    const petName = input.petContext?.name || 'your pet';
    const petSpecies = input.petContext?.species || 'pet';
    const lastUserMessage = input.messages
      .filter((m) => m.role === 'user')
      .slice(-1)[0]?.content || '';
    const lower = lastUserMessage.toLowerCase();

    if (isEmergency) {
      return {
        message: `⚠️ RED-FLAG EMERGENCY ALERT FOR ${petName.toUpperCase()}: The symptoms or keywords you described (${detectedRedFlags.join(', ')}) indicate acute clinical distress. Please stop messaging and immediately transport ${petName} to the nearest 24/7 veterinary emergency hospital. Do NOT give human medications or attempt home remedies without direct veterinary direction.`,
        isEmergency: true,
        detectedRedFlags,
        suggestedActions: [
          'Locate and call the nearest 24/7 Emergency Animal Hospital',
          'Keep your pet warm, calm, and minimize physical movement',
          'Do NOT administer human medication (acetaminophen, ibuprofen, and aspirin are highly toxic)',
          'Bring any suspected packaging, plants, or toxins along with you',
        ],
        disclaimer: MEDICAL_DISCLAIMER,
        generatedBy: 'clinical_rule_engine',
      };
    }

    // Inform the user the AI engine is not available
    const aiUnavailableNote = isConfiguredCredential(env.GEMINI_API_KEY)
      ? '' // Gemini IS configured — this fallback only runs if the API call itself failed
      : ' (Note: The AI assistant is currently operating in basic mode because the AI engine is not yet configured by the administrator.)';

    let response = `Hello! Regarding ${petName} (${petSpecies}):${aiUnavailableNote} `;

    if (lower.includes('food') || lower.includes('eat') || lower.includes('diet') || lower.includes('feed')) {
      response += `Consistent nutrition is essential. Ensure ${petName} is fed age-appropriate, balanced food in measured portions. Always avoid toxic items like onions, garlic, chocolate, grapes/raisins, and xylitol. If ${petName} refuses to eat for more than 24 hours (or 12 hours for young puppies/kittens), schedule a veterinary checkup.`;
    } else if (lower.includes('vomit') || lower.includes('diarrhea') || lower.includes('stomach')) {
      response += `For mild, isolated digestive upset, monitor hydration closely and provide access to clean water. You may offer small portions of a bland diet (boiled plain chicken and white rice for dogs). If vomiting or diarrhea recurs multiple times, contains blood, or is accompanied by severe lethargy, seek prompt veterinary evaluation.`;
    } else if (lower.includes('flea') || lower.includes('tick') || lower.includes('scratch') || lower.includes('itch')) {
      response += `Frequent scratching can stem from flea allergy dermatitis, environmental allergens, or ear mites. Veterinary-prescribed monthly parasiticide treatments (such as isoxazoline or spot-on therapies) are the safest and most effective standard of care. Avoid over-the-counter flea collars that may irritate sensitive skin.`;
    } else if (lower.includes('vaccin') || lower.includes('shot')) {
      response += `Core vaccinations (such as Rabies and DHPP for dogs, or FVRCP and Rabies for cats) protect against life-threatening viral infections. Please check your PetVerse vaccination tracker or consult your veterinary clinic to ensure booster schedules are strictly maintained.`;
    } else {
      response += `Maintaining proactive wellness routines—including routine veterinary checkups, dental hygiene, balanced nutrition, and daily physical exercise—ensures long-term vitality. If you notice any changes in behavior, appetite, or bathroom habits, please book an appointment with a licensed veterinarian.`;
    }

    return {
      message: response,
      isEmergency: false,
      detectedRedFlags: [],
      suggestedActions: [
        'Monitor daily water intake, appetite, and stool quality',
        'Book a routine or urgent clinic appointment if symptoms persist past 24-48 hours',
      ],
      disclaimer: MEDICAL_DISCLAIMER,
      generatedBy: 'clinical_rule_engine',
    };
  },
};
