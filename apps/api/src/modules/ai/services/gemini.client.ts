import { env, isConfiguredCredential } from '../../../config/env';
import { logger } from '../../../shared/utils/logger';
import type {
  SymptomAnalysisInput,
  BreedScanInput,
  DietRecommendationInput,
  ChatAssistantInput,
} from '../schemas/ai.schemas';
import type {
  SymptomAnalysisResult,
  BreedScanResult,
  DietRecommendationResult,
} from './ai.service';

const GEMINI_BASE_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models';

// Model fallback chain — ordered by capability (highest first).
// If a model is overloaded (503) or rate-limited (429), the next model is tried automatically.
const GEMINI_MODEL_CHAIN = [
  env.GEMINI_MODEL || 'gemini-3.7-flash', // Primary (from env)
  'gemini-3.6-flash',                     // First fallback
  'gemini-flash-lite-latest',             // Lightweight fallback
];

export const geminiClient = {
  isConfigured(): boolean {
    return isConfiguredCredential(env.GEMINI_API_KEY);
  },

  getModel(): string {
    return GEMINI_MODEL_CHAIN[0];
  },

  getEndpointForModel(model: string): string {
    return `${GEMINI_BASE_ENDPOINT}/${model}:generateContent`;
  },

  /** @deprecated use getEndpointForModel */
  getEndpoint(): string {
    return this.getEndpointForModel(this.getModel());
  },

  /**
   * Symptom triage analysis powered directly by Gemini API.
   * Prompts the model with strict veterinary triage guidelines and structured JSON schema.
   */
  async analyzeSymptoms(input: SymptomAnalysisInput): Promise<Partial<SymptomAnalysisResult> | null> {
    if (!this.isConfigured()) {
      logger.warn('[GeminiClient] analyzeSymptoms skipped — GEMINI_API_KEY not configured');
      return null;
    }
    logger.info('[GeminiClient] analyzeSymptoms called', { model: this.getModel() });

    const systemInstruction = `You are PetVerse AI, an expert veterinary clinical triage model.
You evaluate pet symptoms strictly for triage urgency and safety.
SAFETY RULES:
1. DO NOT provide definitive medical diagnoses or prescribe medications.
2. If symptoms indicate emergency (respiratory distress, seizure, toxic ingestion, bloat, collapse, severe bleeding, inability to urinate), classify triageUrgency as "EMERGENCY" and isEmergency as true.
3. If moderate/subacute, classify triageUrgency as "URGENT".
4. If mild/transient, classify triageUrgency as "ROUTINE".
5. Return ONLY a valid JSON object matching this schema:
{
  "triageUrgency": "EMERGENCY" | "URGENT" | "ROUTINE",
  "summary": string,
  "isEmergency": boolean,
  "potentialConsiderations": string[],
  "recommendedActions": string[],
  "questionsForVeterinarian": string[],
  "redFlags": string[]
}`;

    const userPrompt = `Patient Species: ${input.species}
Symptoms: ${input.symptoms.join(', ')}
Severity: ${input.severity}
Duration: ${input.duration}
Age in Months: ${input.petAgeMonths ?? 'Unknown'}
Additional Clinical Notes: ${input.additionalNotes ?? 'None'}`;

    try {
      const response = await this._callGemini([
        { role: 'user', parts: [{ text: `${systemInstruction}\n\n${userPrompt}` }] },
      ]);

      if (!response) return null;
      const cleanJson = this._extractJson(response);
      return JSON.parse(cleanJson) as Partial<SymptomAnalysisResult>;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.warn('[GeminiClient] Symptom analysis inference failed', { error: message });
      return null;
    }
  },

  /**
   * Breed identification from visual features or base64 photo via Gemini multimodal vision.
   */
  async identifyBreed(input: BreedScanInput): Promise<Partial<BreedScanResult> | null> {
    if (!this.isConfigured()) {
      logger.warn('[GeminiClient] identifyBreed skipped — GEMINI_API_KEY not configured');
      return null;
    }
    logger.info('[GeminiClient] identifyBreed called', {
      model: this.getModel(),
      hasImageBase64: Boolean(input.imageBase64),
      hasImageUrl: Boolean(input.imageUrl),
    });

    const systemInstruction = `You are PetVerse AI, a specialized veterinary breed recognition and genetics model.
Analyze the pet's characteristics. Return ONLY a valid JSON object matching this schema:
{
  "species": "${input.species}",
  "primaryBreed": string,
  "confidence": number (between 70 and 99.5),
  "secondaryBreeds": [{"breed": string, "confidence": number}],
  "characteristics": {
    "energyLevel": string,
    "groomingNeeds": string,
    "temperament": string[],
    "typicalWeightRangeKg": {"min": number, "max": number},
    "lifeExpectancyYears": {"min": number, "max": number}
  },
  "healthConsiderations": string[],
  "careTips": string[]
}`;

    try {
      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

      if (input.imageBase64) {
        const matches = input.imageBase64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          parts.push({
            inlineData: {
              mimeType: matches[1],
              data: matches[2],
            },
          });
        }
      }

      parts.push({
        text: `${systemInstruction}\n\nSpecies: ${input.species}. ${input.imageUrl ? `Image URL: ${input.imageUrl}` : 'Photo provided in visual payload.'}`,
      });

      const response = await this._callGemini([{ role: 'user', parts }]);
      if (!response) return null;
      logger.info('[GeminiClient] Raw breed scan response (first 200 chars)', {
        preview: response.slice(0, 200),
      });
      const cleanJson = this._extractJson(response);
      return JSON.parse(cleanJson) as Partial<BreedScanResult>;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.warn('[GeminiClient] Breed scan inference failed', { error: message });
      return null;
    }
  },

  /**
   * Conversational veterinary guidance for Pet Assistant chat.
   */
  async chatWithAssistant(input: ChatAssistantInput): Promise<string | null> {
    if (!this.isConfigured()) {
      logger.warn('[GeminiClient] chatWithAssistant skipped — GEMINI_API_KEY not configured');
      return null;
    }
    logger.info('[GeminiClient] chatWithAssistant called', {
      model: this.getModel(),
      messageCount: input.messages.length,
    });

    const petInfo = input.petContext
      ? `Pet Context: Name: ${input.petContext.name ?? 'Pet'}, Species: ${input.petContext.species ?? 'Unknown'}, Breed: ${input.petContext.breed ?? 'Unknown'}, Age: ${input.petContext.ageMonths ? `${input.petContext.ageMonths} months` : 'Unknown'}, Weight: ${input.petContext.weightKg ? `${input.petContext.weightKg} kg` : 'Unknown'}, Medical Conditions: ${input.petContext.medicalConditions?.join(', ') ?? 'None'}`
      : 'No specific pet profile provided.';

    const systemPrompt = `You are PetVerse AI, a compassionate, certified veterinary triage and pet wellness assistant.
${petInfo}

CRITICAL VETERINARY BOUNDARIES:
1. Always prioritize pet health and safety.
2. DO NOT formulate definitive clinical diagnoses or prescribe prescription medications.
3. Strongly advise in-person veterinary consultation for medical concerns.
4. If red-flag symptoms are mentioned (choking, seizures, bleeding, poison, difficulty breathing, collapse, inability to urinate), clearly urge the pet owner to seek emergency veterinary care at a 24/7 clinic immediately.
5. Provide helpful, scientifically accurate nutrition, wellness, exercise, and preventative care tips.`;

    const contents = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      ...input.messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
    ];

    try {
      return await this._callGemini(contents);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.warn('[GeminiClient] Chat assistant inference failed', { error: message });
      return null;
    }
  },

  // ─── Private HTTP Helper ─────────────────────────────────

  async _callGemini(contents: any[], modelIndex = 0): Promise<string | null> {
    if (modelIndex >= GEMINI_MODEL_CHAIN.length) {
      logger.warn('[GeminiClient] All models in chain exhausted — no response available');
      return null;
    }

    const model = GEMINI_MODEL_CHAIN[modelIndex];
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    try {
      const url = `${this.getEndpointForModel(model)}?key=${env.GEMINI_API_KEY}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.2,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      // Model overloaded or rate-limited — try next model in chain
      if (res.status === 503 || res.status === 429) {
        const nextModel = GEMINI_MODEL_CHAIN[modelIndex + 1];
        logger.warn('[GeminiClient] Model overloaded, trying next in chain', {
          failedModel: model,
          nextModel: nextModel ?? 'none (chain exhausted)',
          status: res.status,
        });
        await new Promise((r) => setTimeout(r, 800));
        return this._callGemini(contents, modelIndex + 1);
      }

      if (!res.ok) {
        const errorText = await res.text();
        logger.warn('[GeminiClient] Gemini API HTTP error', {
          status: res.status,
          model,
          errorText: errorText.slice(0, 300),
        });
        return null;
      }

      const data = (await res.json()) as any;
      const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (modelIndex > 0) {
        logger.info('[GeminiClient] Succeeded with fallback model', { model, modelIndex });
      }
      return candidateText ? (candidateText as string) : null;
    } catch (err: unknown) {
      clearTimeout(timeout);
      // If request timed out and more models are available, try the next one
      const isTimeout = err instanceof Error && err.name === 'AbortError';
      if (isTimeout && modelIndex + 1 < GEMINI_MODEL_CHAIN.length) {
        const nextModel = GEMINI_MODEL_CHAIN[modelIndex + 1];
        logger.warn('[GeminiClient] Model timed out, trying next in chain', {
          timedOutModel: model,
          nextModel,
        });
        return this._callGemini(contents, modelIndex + 1);
      }
      throw err;
    }
  },

  /**
   * Extracts a JSON object from model output using three strategies:
   * 1. Markdown code block: ```json ... ```
   * 2. First { to last } brace extraction (handles prose-wrapped JSON)
   * 3. Raw trimmed text (last resort)
   */
  _extractJson(text: string): string {
    // Strategy 1: markdown code block
    const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlock?.[1]) return codeBlock[1].trim();

    // Strategy 2: find outermost { ... } object
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return text.slice(firstBrace, lastBrace + 1).trim();
    }

    // Strategy 3: raw trimmed text
    return text.trim();
  },
};
