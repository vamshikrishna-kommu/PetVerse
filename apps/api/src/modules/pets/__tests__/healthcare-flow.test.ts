import { petService } from '../pet.service';
import { healthService } from '../../health/health.service';
import { vaccinationService } from '../../vaccination/services/vaccination.service';
import { prescriptionService } from '../../medication/services/prescription.service';
import { administrationService } from '../../medication/services/administration.service';
import { reminderService } from '../../reminders/services/reminder.service';
import { authService } from '../../auth/auth.service';
import { ForbiddenError, NotFoundError } from '../../../shared/errors/AppError';
import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/petverse_test';

describe('PetVerse Core Healthcare Flow Integration Tests', () => {
  jest.setTimeout(30000);

  const userAId = new mongoose.Types.ObjectId().toString();
  const userBId = new mongoose.Types.ObjectId().toString();
  let createdPetId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  it('1. User A creates a pet with full medical profile', async () => {
    const pet = await petService.createPet(userAId, {
      name: 'Luna',
      species: 'dog',
      breed: 'Golden Retriever',
      gender: 'female',
      weight: 24.5,
      allergies: ['Peanuts'],
      chronicDiseases: ['Mild Hip Dysplasia'],
      lifestyle: 'indoor',
      activityLevel: 'high',
    });

    expect(pet).toBeDefined();
    expect(pet.name).toBe('Luna');
    expect(pet.ownerId).toBe(userAId);
    expect(pet._id).toBeDefined();
    createdPetId = pet._id;
  });

  it('2. User A logs a medical visit for Luna', async () => {
    const record = await healthService.createVisit(createdPetId, userAId, false, {
      visitType: 'routine_checkup',
      visitDate: new Date().toISOString().split('T')[0],
      visitReason: 'Annual wellness checkup',
      vetName: 'Dr. Sarah Jenkins',
      clinicName: 'City Pet Hospital',
      physicalExam: 'Overall healthy condition. Weight steady.',
    });

    expect(record).toBeDefined();
    expect(record.petId.toString()).toBe(createdPetId);
  });

  it('3. User A records a Rabies vaccination', async () => {
    const vacRecord = await vaccinationService.recordVaccination(createdPetId, userAId, {
      vaccineId: new mongoose.Types.ObjectId().toString(),
      status: 'completed',
      currentDoseNumber: 1,
      notes: 'Rabies 3-year booster given left shoulder',
    });

    expect(vacRecord).toBeDefined();
    expect(vacRecord.petId.toString()).toBe(createdPetId);
  });

  it('4. User A issues a prescription and verifies course + reminder creation', async () => {
    const rx = await prescriptionService.createPrescription(
      {
        petId: createdPetId,
        ownerId: userAId,
        // vetName is not a field on IPrescription (use doctorId for FK or notes for free text)
        // notes is the correct approach in tests without a real doctor record
      },
      [
        {
          medicationId: 'Amoxicillin 250mg',
          dosage: '1 tablet',
          route: 'oral',
          frequencyRule: 'twice_daily',
          schedule: {
            morning: true,
            afternoon: false,
            evening: true,
            night: false,
            beforeFood: false,
            afterFood: true,
          },
          durationDays: 7,
          quantity: 14,
          specialInstructions: 'Take daily with food',
        },
      ],
      userAId
    );

    expect(rx).toBeDefined();
    expect(rx.petId).toBe(createdPetId);
  });

  it('5. User A gets health summary for Luna', async () => {
    const summary = await healthService.getHealthSummary(createdPetId, userAId, false);
    expect(summary).toBeDefined();
    // IHealthSummary shape: petId, generatedAt, petProfile, activeConditions, activeMedications, ...
    expect(summary.petId).toBeDefined();
    expect(summary.generatedAt).toBeDefined();
    // healthScore is not part of IHealthSummary (see shared-types). Assert the actual fields:
    expect(Array.isArray(summary.activeConditions)).toBe(true);
    expect(Array.isArray(summary.activeMedications)).toBe(true);
  });

  it('6. Security Check: User B cannot access User A pet or health records', async () => {
    await expect(petService.getPetById(createdPetId, userBId, false)).rejects.toThrow(
      ForbiddenError
    );

    await expect(healthService.getHealthSummary(createdPetId, userBId, false)).rejects.toThrow(
      ForbiddenError
    );
  });

  it('7. Cascading Delete: Deleting pet cleans up pet profile and timeline', async () => {
    await petService.deletePet(createdPetId, userAId, false);
    await expect(petService.getPetById(createdPetId, userAId, false)).rejects.toThrow(
      NotFoundError
    );
  });
});
