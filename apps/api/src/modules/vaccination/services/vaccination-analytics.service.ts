import { vaccinationRecordRepository } from '../repositories/vaccination-record.repository';
import { vaccinationReactionRepository } from '../repositories/vaccination-reaction.repository';

export class VaccinationAnalyticsService {
  async getPetAnalytics(petId: string) {
    const records = await vaccinationRecordRepository.findByPet(petId);
    const reactions = await vaccinationReactionRepository.findByPet(petId);
    
    let totalDoses = 0;
    let completedDoses = 0;
    let missedDoses = 0;
    
    records.forEach(record => {
      record.doses.forEach(dose => {
        totalDoses++;
        if (dose.status === 'completed') completedDoses++;
        if (dose.status === 'overdue' || dose.status === 'skipped') missedDoses++;
      });
    });
    
    const completionRate = totalDoses > 0 ? (completedDoses / totalDoses) * 100 : 0;
    const reactionRate = totalDoses > 0 ? (reactions.length / totalDoses) * 100 : 0;
    
    return {
      completionRate: Math.round(completionRate),
      totalDoses,
      completedDoses,
      missedDoses,
      reactionCount: reactions.length,
      reactionRate: Math.round(reactionRate)
    };
  }
}

export const vaccinationAnalyticsService = new VaccinationAnalyticsService();
