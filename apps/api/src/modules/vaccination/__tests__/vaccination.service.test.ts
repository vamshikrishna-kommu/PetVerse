import mongoose from 'mongoose';
import { vaccinationService } from '../services/vaccination.service';
import { petService } from '../../pets/pet.service';
import { VaccinationRecord } from '../models/vaccination-record.model';
import { VaccinationReaction } from '../models/vaccination-reaction.model';
import { ForbiddenError } from '../../../shared/errors/AppError';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/petverse_test';

describe('Vaccination Service Unit Tests', () => {
  jest.setTimeout(30000);

  const ownerId = new mongoose.Types.ObjectId().toString();
  const strangerId = new mongoose.Types.ObjectId().toString();
  let petId: string;
  let recordId: string;
  const doseId = new mongoose.Types.ObjectId().toString();

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }

    const pet = await petService.createPet(ownerId, {
      name: 'Bella',
      species: 'dog',
      breed: 'Labrador Retriever',
    });
    petId = pet._id.toString();
  });

  afterAll(async () => {
    if (petId) {
      await petService.deletePet(petId, ownerId, false);
    }
    await VaccinationRecord.deleteMany({ ownerId });
    await VaccinationReaction.deleteMany({ petId });
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe('1. Vaccination Administration Record', () => {
    it('records a vaccination dose and creates a timeline event', async () => {
      const vaccineId = new mongoose.Types.ObjectId().toString();
      const record = await vaccinationService.recordVaccination(petId, ownerId, {
        vaccineId,
        status: 'completed',
        currentDoseNumber: 1,
        doses: [
          {
            _id: doseId,
            doseNumber: 1,
            doseType: 'primary',
            status: 'completed',
            dueDate: new Date().toISOString(),
            administeredDate: new Date().toISOString(),
            administeredBy: 'Dr. John Doe',
            clinicName: 'Downtown Pet Clinic',
            batchNumber: 'LOT-987654',
            notes: 'No immediate signs of distress',
          },
        ],
      });

      expect(record).toBeDefined();
      expect(record.petId.toString()).toBe(petId);
      expect(record.status).toBe('completed');
      expect(record.doses).toHaveLength(1);
      expect(record.doses[0].batchNumber).toBe('LOT-987654');
      recordId = record._id.toString();
    });

    it('rejects recording vaccination by an unauthorized user', async () => {
      await expect(
        vaccinationService.recordVaccination(petId, strangerId, {
          vaccineId: new mongoose.Types.ObjectId().toString(),
        })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('2. Adverse Reactions Tracking', () => {
    it('logs an adverse vaccine reaction', async () => {
      const reaction = await vaccinationService.recordReaction(petId, ownerId, {
        vaccinationRecordId: recordId,
        doseId,
        onsetDateTime: new Date().toISOString(),
        symptoms: ['Mild fever', 'Lethargy'],
        severity: 'mild',
        vetNotes: 'Monitored at home; resolved within 24 hours.',
      });

      expect(reaction).toBeDefined();
      expect(reaction.vaccinationRecordId.toString()).toBe(recordId);
      expect(reaction.symptoms).toContain('Mild fever');
      expect(reaction.severity).toBe('mild');
    });
  });

  describe('3. Pet Vaccination History', () => {
    it('retrieves all vaccination records for a pet', async () => {
      const list = await VaccinationRecord.find({ petId });
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBeGreaterThanOrEqual(1);
      expect(list[0]._id.toString()).toBe(recordId);
    });
  });
});
