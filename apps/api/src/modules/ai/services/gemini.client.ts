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

// Model fallback chain — ordered by capability and availability.
// If a model is overloaded (503), rate-limited (429), or deprecated (404), the next model is tried automatically.
const GEMINI_MODEL_CHAIN = [
  env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest',
];

import { BadRequestError } from '../../../shared/errors/AppError';

export type DetectedSpecies = 'DOG' | 'CAT' | 'OTHER_ANIMAL' | 'PERSON' | 'OBJECT' | 'UNKNOWN';

export interface ValidatedImagePayload {
  mimeType: string;
  base64Data: string;
}

export function validateImagePayload(input: BreedScanInput): ValidatedImagePayload | null {
  if (input.imageBase64) {
    const raw = input.imageBase64.trim();
    let mimeType = 'image/jpeg';
    let base64Data = raw;

    const dataUriMatch = raw.match(/^data:([A-Za-z0-9+/.-]+);base64,(.+)$/);
    if (dataUriMatch) {
      mimeType = dataUriMatch[1].toLowerCase();
      base64Data = dataUriMatch[2].trim();
    }

    const ALLOWED_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!ALLOWED_MIMES.includes(mimeType)) {
      throw new BadRequestError(`Unsupported image format: ${mimeType}. Please upload a JPEG, PNG, or WebP image.`);
    }

    const buffer = Buffer.from(base64Data, 'base64');
    if (buffer.length < 200) {
      throw new BadRequestError('Image data is too small or corrupted to contain a recognizable subject.');
    }
    const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
    if (buffer.length > MAX_SIZE_BYTES) {
      throw new BadRequestError('Image exceeds the maximum allowed size of 10MB.');
    }

    return {
      mimeType: mimeType === 'image/jpg' ? 'image/jpeg' : mimeType,
      base64Data,
    };
  }

  if (input.imageUrl) {
    try {
      const parsedUrl = new URL(input.imageUrl);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new BadRequestError('Image URL must use http or https protocol.');
      }
    } catch {
      throw new BadRequestError('Invalid image URL format.');
    }
    return null;
  }

  throw new BadRequestError('Either an image URL or image base64 data must be provided.');
}

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
   * Multimodal Breed & Subject Identification using Gemini Vision.
   * Classifies primary subject into DOG, CAT, OTHER_ANIMAL, PERSON, OBJECT, or UNKNOWN.
   * Identifies breeds strictly for dogs and cats based ONLY on observable visual evidence.
   */
  async identifyBreed(
    input: BreedScanInput,
    validatedImage?: ValidatedImagePayload | null
  ): Promise<Partial<BreedScanResult> | null> {
    if (!this.isConfigured()) {
      logger.warn('[BreedIdentifier] identifyBreed skipped — GEMINI_API_KEY not configured');
      return null;
    }

    logger.info('[BreedIdentifier] Gemini request started', {
      hasImageBase64: Boolean(input.imageBase64),
      hasImageUrl: Boolean(input.imageUrl),
    });

    const systemInstruction = `You are PetVerse AI, an expert veterinary multimodal classification system.
Your job is to accurately identify whether an image contains a domestic dog, domestic cat, other animal, person, object, or unknown subject, and if and only if it is a dog or cat, identify its breed.

RULES:
1. PRIMARY SUBJECT CLASSIFICATION:
Classify the primary subject into EXACTLY ONE category:
- "DOG": A domestic dog (canine).
- "CAT": A domestic cat (feline).
- "OTHER_ANIMAL": Any animal other than a domestic dog or cat (such as a bird, rabbit, reptile, farm animal, horse, wildlife, etc.).
- "PERSON": A human being, human face, portrait, selfie, or person.
- "OBJECT": Inanimate object, vehicle, car, furniture, food, building, screen, screenshot, document, graphic, landscape, or artwork.
- "UNKNOWN": Unclear, blurry, dark, cropped, empty, ambiguous, or unrecognizable.

2. MULTIPLE ANIMALS:
If multiple animals are present and there is no single clear primary dog or cat subject:
- species: "UNKNOWN"
- isPetSupported: false
- breed: null
- explanation: "Multiple animals were detected. Please upload a photo containing one dog or cat for more accurate breed identification."

3. NON-DOG / NON-CAT / UNSUPPORTED HANDLING:
If the primary subject is NOT a single domestic DOG or CAT:
- isPetSupported: MUST be false
- breed: MUST be null. NEVER guess, hallucinate, or return a breed (NEVER return Golden Retriever or any breed).
- confidence: A decimal between 0.70 and 0.99 reflecting certainty of this subject classification.
- uncertain: false
- explanation: State clearly what was detected:
  * For PERSON: "This image appears to contain a person, not a dog or cat. Please upload a clear photo of a dog or cat for breed identification."
  * For OBJECT: "This image appears to contain an object, vehicle, or screen, not a dog or cat. Please upload a clear photo of a dog or cat for breed identification."
  * For OTHER_ANIMAL: "This image appears to contain another type of animal. Breed identification is currently supported for dogs and cats."
  * For UNKNOWN: "I couldn't confidently identify a dog or cat in this image. Please upload a clear photo showing the animal."
- characteristics: MUST be null
- secondaryBreeds: MUST be []
- healthConsiderations: MUST be []
- careTips: MUST be []

4. FOR DOG OR CAT (isPetSupported: true):
- breed: Most likely breed or mix based ONLY on visual evidence.
  * Support common, rare, and Indian breeds when visually supported (e.g., Indian Pariah Dog / Indian Native Dog, Rajapalayam, Mudhol Hound, Chippiparai, Kombai, Indian Spitz, Labrador Retriever, Golden Retriever, German Shepherd, Beagle, Pug, Shih Tzu, Husky, Boxer, Doberman, Persian, Siamese, Bengal, Maine Coon, Indian Domestic Cat).
  * If the animal appears to be a mixed breed, return "Mixed Breed" or "Likely mixed breed — possible [Breed] mix". Do NOT force into a purebred classification.
  * NEVER fabricate or default to Golden Retriever or any predetermined breed without visual evidence.
- confidence: Decimal between 0.0 and 1.0 (e.g. 0.91, 0.48). NEVER manufacture a high confidence score.
- uncertain: Set to true if confidence is low (< 0.65) or if traits are mixed/ambiguous, otherwise false.
- explanation: Concrete visual evidence explaining head shape, ears, coat texture, coloring, and body proportions.
- characteristics:
  {
    "energyLevel": "Low" | "Moderate" | "High",
    "groomingNeeds": "Low" | "Moderate" | "High",
    "temperament": string[],
    "typicalWeightRangeKg": { "min": number, "max": number },
    "lifeExpectancyYears": { "min": number, "max": number },
    "visualTraits": string[]
  }
- secondaryBreeds: [{ "breed": string, "confidence": number }]
- healthConsiderations: string[]
- careTips: string[]

RETURN ONLY VALID JSON MATCHING:
{
  "species": "DOG" | "CAT" | "OTHER_ANIMAL" | "PERSON" | "OBJECT" | "UNKNOWN",
  "isPetSupported": boolean,
  "breed": string | null,
  "confidence": number,
  "uncertain": boolean,
  "explanation": string,
  "characteristics": object | null,
  "secondaryBreeds": array,
  "healthConsiderations": array,
  "careTips": array
}`;

    try {
      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

      let imageToUse = validatedImage;
      if (!imageToUse && input.imageBase64) {
        imageToUse = validateImagePayload(input);
      } else if (!imageToUse && input.imageUrl) {
        try {
          const fetchRes = await fetch(input.imageUrl);
          if (fetchRes.ok) {
            const arr = await fetchRes.arrayBuffer();
            const mime = fetchRes.headers.get('content-type') || 'image/jpeg';
            imageToUse = {
              mimeType: mime.split(';')[0],
              base64Data: Buffer.from(arr).toString('base64'),
            };
          }
        } catch (fetchErr) {
          logger.warn('[BreedIdentifier] Could not download image URL for vision scan', {
            error: fetchErr instanceof Error ? fetchErr.message : 'Unknown',
          });
        }
      }

      if (imageToUse) {
        parts.push({
          inlineData: {
            mimeType: imageToUse.mimeType,
            data: imageToUse.base64Data,
          },
        });
      }

      parts.push({
        text: `${systemInstruction}\n\nAnalyze the primary subject in the image and return the structured JSON object.`,
      });

      const response = await this._callGemini([{ role: 'user', parts }], 0, {
        responseMimeType: 'application/json',
        temperature: 0.1,
      });

      if (!response) {
        logger.warn('[BreedIdentifier] Gemini returned empty response');
        return null;
      }

      const cleanJson = this._extractJson(response);
      const parsed = JSON.parse(cleanJson) as Record<string, any>;

      logger.info('[BreedIdentifier] Gemini response received');
      logger.info(`[BreedIdentifier] Classification: ${parsed.species}`);
      logger.info(`[BreedIdentifier] Breed: ${parsed.breed ?? 'None'}`);
      logger.info(`[BreedIdentifier] Confidence: ${parsed.confidence}`);

      return parsed as Partial<BreedScanResult>;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.warn('[BreedIdentifier] Breed scan inference failed', { error: message });
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

  async _callGemini(
    contents: any[],
    modelIndex = 0,
    generationConfigOverride?: Record<string, unknown>
  ): Promise<string | null> {
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
            ...generationConfigOverride,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      // Model overloaded (503), rate-limited (429), or deprecated (404) — try next model in chain
      if (res.status === 503 || res.status === 429 || res.status === 404) {
        const nextModel = GEMINI_MODEL_CHAIN[modelIndex + 1];
        logger.warn('[GeminiClient] Model unavailable, trying next in chain', {
          failedModel: model,
          nextModel: nextModel ?? 'none (chain exhausted)',
          status: res.status,
        });
        await new Promise((r) => setTimeout(r, 600));
        return this._callGemini(contents, modelIndex + 1, generationConfigOverride);
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
        return this._callGemini(contents, modelIndex + 1, generationConfigOverride);
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
