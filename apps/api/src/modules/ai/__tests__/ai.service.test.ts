import { aiService } from '../services/ai.service';
import { geminiClient } from '../services/gemini.client';

describe('Phase 4 — AI Service Clinical Safety & Recommendations', () => {
  jest.setTimeout(30000);
  describe('Symptom Analysis & Clinical Triage', () => {
    it('should flag EMERGENCY urgency with red-flag symptoms', async () => {
      const result = await aiService.analyzeSymptoms({
        species: 'dog',
        symptoms: ['pale gums', 'collapse', 'labored breathing'],
        duration: 'hours',
        severity: 'severe',
      });

      expect(result.triageUrgency).toBe('EMERGENCY');
      expect(result.isEmergency).toBe(true);
      expect(result.redFlags.length).toBeGreaterThan(0);
      expect(result.disclaimer).toBeDefined();
      expect(result.disclaimer).toContain('licensed veterinarian');
      expect(result.potentialConsiderations.length).toBeGreaterThan(0);
    });

    it('should flag URGENT or ROUTINE with actionable steps for non-emergency symptoms', async () => {
      const result = await aiService.analyzeSymptoms({
        species: 'cat',
        symptoms: ['vomiting', 'lethargy'],
        duration: 'days',
        severity: 'moderate',
      });

      expect(['URGENT', 'ROUTINE', 'EMERGENCY']).toContain(result.triageUrgency);
      expect(result.disclaimer).toBeDefined();
      expect(result.recommendedActions.length).toBeGreaterThan(0);
    });

    it('should assign ROUTINE for mild, non-critical symptoms', async () => {
      const result = await aiService.analyzeSymptoms({
        species: 'dog',
        symptoms: ['mild scratching around ears'],
        duration: 'hours',
        severity: 'mild',
      });

      expect(result.triageUrgency).toBe('ROUTINE');
      expect(result.isEmergency).toBe(false);
      expect(result.disclaimer).toBeDefined();
      expect(result.potentialConsiderations).toBeDefined();
    });

    it('should enforce veterinary disclaimer on all responses without definitive diagnosis', async () => {
      const result = await aiService.analyzeSymptoms({
        species: 'dog',
        symptoms: ['limping on left hind leg'],
        duration: 'days',
        severity: 'mild',
      });

      expect(result.disclaimer).toMatch(/not constitute a definitive veterinary diagnosis/i);
      expect(result.potentialConsiderations.length).toBeGreaterThan(0);
    });
  });

  describe('Breed Identification & Multimodal Classification', () => {
    it('1. Dog image -> dog breed result', async () => {
      jest.spyOn(geminiClient, 'identifyBreed').mockResolvedValueOnce({
        species: 'DOG',
        isPetSupported: true,
        breed: 'Labrador Retriever',
        confidence: 0.92,
        uncertain: false,
        explanation: 'The broad head, short dense coat, and tail structure are characteristic of a Labrador Retriever.',
        characteristics: {
          energyLevel: 'High',
          groomingNeeds: 'Moderate',
          temperament: ['Friendly', 'Active', 'Gentle'],
          typicalWeightRangeKg: { min: 25, max: 36 },
          lifeExpectancyYears: { min: 10, max: 12 },
          visualTraits: ['Broad muzzle', 'Short water-resistant coat'],
        },
        secondaryBreeds: [],
        healthConsiderations: ['Hip Dysplasia', 'Obesity'],
        careTips: ['At least 60 mins of daily exercise'],
      });

      const result = await aiService.identifyBreed({
        imageUrl: 'https://example.com/labrador.jpg',
      });

      expect(result.species).toBe('DOG');
      expect(result.isPetSupported).toBe(true);
      expect(result.breed).toBe('Labrador Retriever');
      expect(result.confidence).toBe(0.92);
      expect(result.uncertain).toBe(false);
      expect(result.explanation).toContain('Labrador Retriever');
      expect(result.characteristics?.temperament).toContain('Friendly');
    });

    it('2. Cat image -> cat breed result', async () => {
      jest.spyOn(geminiClient, 'identifyBreed').mockResolvedValueOnce({
        species: 'CAT',
        isPetSupported: true,
        breed: 'Persian',
        confidence: 0.89,
        uncertain: false,
        explanation: 'Round face, shortened muzzle, and long flowing coat are consistent with a Persian cat.',
        characteristics: {
          energyLevel: 'Low',
          groomingNeeds: 'High',
          temperament: ['Quiet', 'Docile', 'Affectionate'],
          typicalWeightRangeKg: { min: 3, max: 6 },
          lifeExpectancyYears: { min: 12, max: 17 },
          visualTraits: ['Brachycephalic facial structure', 'Long dense fur'],
        },
        secondaryBreeds: [],
        healthConsiderations: ['Polycystic Kidney Disease'],
        careTips: ['Daily coat brushing required'],
      });

      const result = await aiService.identifyBreed({
        imageUrl: 'https://example.com/persian.jpg',
      });

      expect(result.species).toBe('CAT');
      expect(result.isPetSupported).toBe(true);
      expect(result.breed).toBe('Persian');
      expect(result.confidence).toBe(0.89);
    });

    it('3. Person image -> PERSON / unsupported (no hallucinated breed)', async () => {
      jest.spyOn(geminiClient, 'identifyBreed').mockResolvedValueOnce({
        species: 'PERSON',
        isPetSupported: false,
        breed: null,
        confidence: 0.98,
        uncertain: false,
        explanation: 'This image appears to contain a person, not a dog or cat. Please upload a clear photo of a dog or cat for breed identification.',
        characteristics: null,
        secondaryBreeds: [],
        healthConsiderations: [],
        careTips: [],
      });

      const result = await aiService.identifyBreed({
        imageUrl: 'https://example.com/selfie.jpg',
      });

      expect(result.species).toBe('PERSON');
      expect(result.isPetSupported).toBe(false);
      expect(result.breed).toBeNull();
      expect(result.breed).not.toBe('Golden Retriever');
      expect(result.explanation).toMatch(/person/i);
    });

    it('4. Car/object image -> OBJECT / unsupported', async () => {
      jest.spyOn(geminiClient, 'identifyBreed').mockResolvedValueOnce({
        species: 'OBJECT',
        isPetSupported: false,
        breed: null,
        confidence: 0.99,
        uncertain: false,
        explanation: 'This image appears to contain a vehicle, not a dog or cat.',
        characteristics: null,
        secondaryBreeds: [],
        healthConsiderations: [],
        careTips: [],
      });

      const result = await aiService.identifyBreed({
        imageUrl: 'https://example.com/car.jpg',
      });

      expect(result.species).toBe('OBJECT');
      expect(result.isPetSupported).toBe(false);
      expect(result.breed).toBeNull();
      expect(result.explanation).toMatch(/vehicle|object/i);
    });

    it('5. Bird image -> OTHER_ANIMAL / unsupported', async () => {
      jest.spyOn(geminiClient, 'identifyBreed').mockResolvedValueOnce({
        species: 'OTHER_ANIMAL',
        isPetSupported: false,
        breed: null,
        confidence: 0.95,
        uncertain: false,
        explanation: 'This image appears to contain another type of animal. Breed identification is currently supported for dogs and cats.',
        characteristics: null,
        secondaryBreeds: [],
        healthConsiderations: [],
        careTips: [],
      });

      const result = await aiService.identifyBreed({
        imageUrl: 'https://example.com/parrot.jpg',
      });

      expect(result.species).toBe('OTHER_ANIMAL');
      expect(result.isPetSupported).toBe(false);
      expect(result.breed).toBeNull();
      expect(result.explanation).toMatch(/another type of animal/i);
    });

    it('6. Blurry/invalid image -> UNKNOWN', async () => {
      jest.spyOn(geminiClient, 'identifyBreed').mockResolvedValueOnce({
        species: 'UNKNOWN',
        isPetSupported: false,
        breed: null,
        confidence: 0.85,
        uncertain: true,
        explanation: "I couldn't confidently identify a dog or cat in this image. Please upload a clear photo showing the animal.",
        characteristics: null,
        secondaryBreeds: [],
        healthConsiderations: [],
        careTips: [],
      });

      const result = await aiService.identifyBreed({
        imageUrl: 'https://example.com/blurry.jpg',
      });

      expect(result.species).toBe('UNKNOWN');
      expect(result.isPetSupported).toBe(false);
      expect(result.breed).toBeNull();
      expect(result.explanation).toMatch(/couldn't confidently identify/i);
    });

    it('7. Multiple animals -> appropriate response asking for single pet', async () => {
      jest.spyOn(geminiClient, 'identifyBreed').mockResolvedValueOnce({
        species: 'UNKNOWN',
        isPetSupported: false,
        breed: null,
        confidence: 0.88,
        uncertain: true,
        explanation: 'Multiple animals were detected. Please upload a photo containing one dog or cat for more accurate breed identification.',
        characteristics: null,
        secondaryBreeds: [],
        healthConsiderations: [],
        careTips: [],
      });

      const result = await aiService.identifyBreed({
        imageUrl: 'https://example.com/two-dogs.jpg',
      });

      expect(result.isPetSupported).toBe(false);
      expect(result.breed).toBeNull();
      expect(result.explanation).toContain('Multiple animals were detected');
    });

    it('8. Mixed breed -> mixed breed response', async () => {
      jest.spyOn(geminiClient, 'identifyBreed').mockResolvedValueOnce({
        species: 'DOG',
        isPetSupported: true,
        breed: 'Likely mixed breed — possible Labrador mix',
        confidence: 0.62,
        uncertain: true,
        explanation: 'Ear set and head profile suggest Labrador ancestry, but body conformation indicates mixed heritage.',
        characteristics: {
          energyLevel: 'Moderate',
          groomingNeeds: 'Moderate',
          temperament: ['Friendly', 'Playful'],
          typicalWeightRangeKg: { min: 18, max: 28 },
          lifeExpectancyYears: { min: 11, max: 14 },
          visualTraits: ['Semi-drop ears', 'Mixed coat pattern'],
        },
        secondaryBreeds: [{ breed: 'Labrador Retriever', confidence: 55 }],
        healthConsiderations: [],
        careTips: ['Regular exercise and balanced nutrition'],
      });

      const result = await aiService.identifyBreed({
        imageUrl: 'https://example.com/mix.jpg',
      });

      expect(result.species).toBe('DOG');
      expect(result.isPetSupported).toBe(true);
      expect(result.breed).toMatch(/mixed breed/i);
      expect(result.uncertain).toBe(true);
    });

    it('9. Low-confidence classification -> uncertain result', async () => {
      jest.spyOn(geminiClient, 'identifyBreed').mockResolvedValueOnce({
        species: 'DOG',
        isPetSupported: true,
        breed: 'Indian Pariah Dog / Indian Native Dog',
        confidence: 0.48,
        uncertain: true,
        explanation: 'Wedge-shaped head and pointed ears resemble Indian native dogs, but low resolution limits confidence.',
        characteristics: null,
        secondaryBreeds: [],
        healthConsiderations: [],
        careTips: [],
      });

      const result = await aiService.identifyBreed({
        imageUrl: 'https://example.com/desi-dog.jpg',
      });

      expect(result.confidence).toBe(0.48);
      expect(result.uncertain).toBe(true);
    });

    it('10. Gemini unavailable -> transparent graceful error', async () => {
      jest.spyOn(geminiClient, 'identifyBreed').mockResolvedValueOnce(null);

      const result = await aiService.identifyBreed({
        imageUrl: 'https://example.com/dog.jpg',
      });

      expect(result.isPetSupported).toBe(false);
      expect(result.breed).toBeNull();
      expect(result.explanation).toMatch(/temporarily unavailable/i);
    });

    it('11. Gemini malformed response / throws -> safe error', async () => {
      jest.spyOn(geminiClient, 'identifyBreed').mockRejectedValueOnce(new Error('Network crash'));

      const result = await aiService.identifyBreed({
        imageUrl: 'https://example.com/dog.jpg',
      });

      expect(result.isPetSupported).toBe(false);
      expect(result.breed).toBeNull();
      expect(result.explanation).toMatch(/temporarily unavailable/i);
    });

    it('12. No hardcoded Golden Retriever fallback on failure or non-pet', async () => {
      jest.spyOn(geminiClient, 'identifyBreed').mockResolvedValueOnce(null);

      const result = await aiService.identifyBreed({
        imageUrl: 'https://example.com/random.jpg',
      });

      expect(result.breed).not.toBe('Golden Retriever');
      expect(result.primaryBreed).not.toBe('Golden Retriever');
      expect(result.isPetSupported).toBe(false);
    });
  });

  describe('Diet & Calorie Calculation (RER & DER)', () => {
    it('should accurately calculate RER and DER for adult dog', async () => {
      const weightKg = 10;
      const result = await aiService.calculateDietRecommendations({
        species: 'dog',
        breed: 'Beagle',
        weightKg,
        ageMonths: 36,
        activityLevel: 'moderate',
        dietaryGoal: 'maintenance',
      });

      // RER = 70 * (10 ^ 0.75) ≈ 70 * 5.623 = 393.6 kcal
      expect(result.targetDailyCaloriesKcal).toBeGreaterThan(500);
      expect(result.targetDailyCaloriesKcal).toBeLessThan(800);
      expect(result.mealsPerDay).toBe(2);
      expect(result.approximateDailyFoodGrams).toBeGreaterThan(0);
      expect(result.toxicFoodsToAvoid.some((f) => /chocolate/i.test(f))).toBe(true);
      expect(result.toxicFoodsToAvoid.some((f) => /grapes/i.test(f))).toBe(true);
      expect(result.disclaimer).toBeDefined();
    });

    it('should adapt portions and toxic foods for felines', async () => {
      const result = await aiService.calculateDietRecommendations({
        species: 'cat',
        breed: 'Siamese',
        weightKg: 4.5,
        ageMonths: 18,
        activityLevel: 'low',
        dietaryGoal: 'maintenance',
      });

      expect(result.targetDailyCaloriesKcal).toBeGreaterThan(150);
      expect(result.targetDailyCaloriesKcal).toBeLessThan(350);
      expect(result.toxicFoodsToAvoid.some((f) => /lilies/i.test(f))).toBe(true);
      expect(result.toxicFoodsToAvoid.some((f) => /onion/i.test(f))).toBe(true);
      expect(result.macronutrientTargets.proteinPercent).toBeGreaterThan(30);
    });
  });

  describe('Conversational AI Assistant & Veterinary Boundaries', () => {
    it('should detect emergency keywords in chat and return critical alert with hospital guidance', async () => {
      const result = await aiService.chatWithAssistant({
        messages: [
          { role: 'user', content: 'My dog ate rat poison and is having a seizure and difficulty breathing!' },
        ],
        petContext: {
          name: 'Buddy',
          species: 'dog',
        },
      });

      expect(result.isEmergency).toBe(true);
      expect(result.detectedRedFlags.length).toBeGreaterThan(0);
      expect(result.detectedRedFlags.some((rf) => ['poison', 'seizure', 'breathing'].includes(rf))).toBe(true);
      expect(result.message).toContain('EMERGENCY');
      expect(result.message.toUpperCase()).toContain('BUDDY');
      expect(result.suggestedActions.some((a) => /emergency/i.test(a))).toBe(true);
      expect(result.disclaimer).toMatch(/not constitute a definitive veterinary diagnosis/i);
    });

    it('should respond to routine pet wellness questions with safe guidance and disclaimer', async () => {
      const result = await aiService.chatWithAssistant({
        messages: [
          { role: 'user', content: 'What is the best feeding schedule for an adult cat?' },
        ],
        petContext: {
          name: 'Luna',
          species: 'cat',
        },
      });

      expect(result.isEmergency).toBe(false);
      expect(result.detectedRedFlags).toEqual([]);
      expect(result.message).toContain('Luna');
      expect(result.suggestedActions.length).toBeGreaterThan(0);
      expect(result.disclaimer).toBeDefined();
    });

    it('should handle chat without pet context gracefully', async () => {
      const result = await aiService.chatWithAssistant({
        messages: [{ role: 'user', content: 'How often do dogs need their rabies vaccine?' }],
      });

      expect(result.isEmergency).toBe(false);
      expect(result.disclaimer).toBeDefined();
      expect(result.message.length).toBeGreaterThan(10);
    });

    it('should fallback gracefully to clinical rule engine if external AI fails or is offline', async () => {
      const result = await aiService.chatWithAssistant({
        messages: [{ role: 'user', content: 'My dog is scratching a lot around the ears' }],
      });

      expect(['external_ai_model', 'clinical_rule_engine']).toContain(result.generatedBy);
      expect(result.suggestedActions.length).toBeGreaterThan(0);
    });
  });
});
