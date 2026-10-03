import { vaccineDefinitionRepository } from '../repositories/vaccine-definition.repository';
import { vaccinationRecordRepository } from '../repositories/vaccination-record.repository';
import type { IVaccinationSchedule, DoseType } from '@petverse/shared-types';

const differenceInDays = (a: Date, b: Date) => Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
const addMonths = (d: Date, months: number) => {
  const result = new Date(d);
  result.setMonth(result.getMonth() + months);
  return result;
};
const isPast = (d: Date) => d.getTime() < new Date().getTime();
const isToday = (d: Date) => {
  const today = new Date();
  return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
};

export class VaccineScheduleService {
  /**
   * Generates a complete lifetime vaccination calendar for a pet based on their species and existing records.
   */
  async generatePetSchedule(petId: string, species: string, dob?: string): Promise<IVaccinationSchedule> {
    // 1. Fetch all applicable vaccines for this species
    const applicableVaccines = await vaccineDefinitionRepository.findBySpecies(species);
    
    // 2. Fetch pet's active vaccination records
    const records = await vaccinationRecordRepository.findActiveByPet(petId);
    
    const upcomingVaccines: IVaccinationSchedule['upcomingVaccines'] = [];
    const completedVaccines: IVaccinationSchedule['completedVaccines'] = [];
    
    // 3. Evaluate each applicable vaccine
    for (const vaccine of applicableVaccines) {
      const record = records.find(r => r.vaccineId._id.toString() === vaccine._id.toString());
      
      if (!record) {
        // No record exists for this vaccine. Need to start primary series.
        let firstDueDate = new Date();
        if (dob) {
          const dobDate = new Date(dob);
          const minAgeDays = vaccine.defaultSchedule.minAgeWeeks * 7;
          const earliestDate = addDays(dobDate, minAgeDays);
          if (earliestDate > new Date()) {
            firstDueDate = earliestDate;
          }
        }
        
        upcomingVaccines.push({
          vaccineId: vaccine._id.toString(),
          vaccineName: vaccine.name,
          doseType: 'primary',
          dueDate: firstDueDate.toISOString(),
          isOverdue: isPast(firstDueDate) && !isToday(firstDueDate),
          daysUntilDue: differenceInDays(firstDueDate, new Date())
        });
      } else {
        // A record exists. Check doses.
        for (const dose of record.doses) {
          if (dose.status === 'completed' && dose.administeredDate) {
            completedVaccines.push({
              vaccineId: vaccine._id.toString(),
              vaccineName: vaccine.name,
              date: dose.administeredDate
            });
          } else if (dose.status === 'upcoming' || dose.status === 'overdue') {
            const dueDate = new Date(dose.dueDate);
            upcomingVaccines.push({
              vaccineId: vaccine._id.toString(),
              vaccineName: vaccine.name,
              doseType: dose.doseType,
              dueDate: dose.dueDate,
              isOverdue: isPast(dueDate) && !isToday(dueDate),
              daysUntilDue: differenceInDays(dueDate, new Date())
            });
          }
        }
        
        // If the record is marked completed, calculate the next booster based on the last dose.
        if (record.status === 'completed') {
          const lastCompletedDose = record.doses.filter(d => d.status === 'completed').pop();
          if (lastCompletedDose && lastCompletedDose.administeredDate) {
            const nextBoosterDate = addMonths(new Date(lastCompletedDose.administeredDate), vaccine.defaultSchedule.boosterFrequencyMonths);
            
            const alreadyScheduled = upcomingVaccines.some(u => u.vaccineId === vaccine._id.toString() && u.doseType === 'booster');
            
            if (!alreadyScheduled) {
               upcomingVaccines.push({
                 vaccineId: vaccine._id.toString(),
                 vaccineName: vaccine.name,
                 doseType: 'booster',
                 dueDate: nextBoosterDate.toISOString(),
                 isOverdue: isPast(nextBoosterDate) && !isToday(nextBoosterDate),
                 daysUntilDue: differenceInDays(nextBoosterDate, new Date())
               });
            }
          }
        }
      }
    }
    
    // 4. Sort upcoming by dueDate
    upcomingVaccines.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    completedVaccines.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return {
      petId,
      species: species as any,
      upcomingVaccines,
      completedVaccines,
      lastCalculated: new Date().toISOString()
    };
  }
}

export const vaccineScheduleService = new VaccineScheduleService();
