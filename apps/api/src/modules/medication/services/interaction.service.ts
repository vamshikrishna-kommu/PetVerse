import { interactionRepository, contraindicationRepository } from '../repositories';
import type { IMedicationInteractionDocument } from '../models/interaction.model';

export class InteractionService {
  /**
   * Evaluates a proposed prescription against existing conditions and medications.
   * This is an AI-ready structured point.
   */
  async evaluateInteractions(newMedicationId: string, currentMedicationIds: string[], conditionNames: string[]) {
    const results = {
      interactions: [] as IMedicationInteractionDocument[],
      contraindications: [] as any[],
      hasSevereWarning: false,
    };

    // 1. Check Drug-Drug Interactions
    if (currentMedicationIds.length > 0) {
      const allMeds = [newMedicationId, ...currentMedicationIds];
      const interactions = await interactionRepository.findInteractions(allMeds);
      
      // Filter for those involving the new med
      results.interactions = interactions.filter(i => 
        i.primaryMedicationId === newMedicationId || i.interactingEntityId === newMedicationId
      );

      if (results.interactions.some(i => i.severity === 'severe' || i.severity === 'fatal')) {
        results.hasSevereWarning = true;
      }
    }

    // 2. Check Drug-Disease Contraindications
    if (conditionNames.length > 0) {
      const contraindications = await contraindicationRepository.check(newMedicationId, conditionNames);
      results.contraindications = contraindications;

      if (contraindications.some(c => c.severity === 'severe' || c.severity === 'fatal')) {
        results.hasSevereWarning = true;
      }
    }

    return results;
  }
}

export const interactionService = new InteractionService();
