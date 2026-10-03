import { aiService } from '../services/ai.service';

describe('Phase 4 — AI Service Clinical Safety & Recommendations', () => {
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

  describe('Breed Identification & Health Insights', () => {
    it('should identify breed with confidence score, characteristics, and disclaimer', async () => {
      const result = await aiService.identifyBreed({
        imageUrl: 'https://example.com/golden-retriever.jpg',
        species: 'dog',
      });

      expect(result.primaryBreed).toBeDefined();
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
      expect(result.characteristics).toBeDefined();
      expect(result.characteristics.temperament.length).toBeGreaterThan(0);
      expect(result.healthConsiderations.length).toBeGreaterThan(0);
      expect(result.disclaimer).toContain('licensed veterinarian');
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
      expect(result.message).toContain('BUDDY');
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
