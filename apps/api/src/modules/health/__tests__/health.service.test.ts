import mongoose from 'mongoose';
import { healthService } from '../health.service';
import { petService } from '../../pets/pet.service';
import { ForbiddenError } from '../../../shared/errors/AppError';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/petverse_test';

describe('HealthService Comprehensive Unit Tests', () => {
  jest.setTimeout(30000);

  const ownerId = new mongoose.Types.ObjectId().toString();
  const unauthorizedUserId = new mongoose.Types.ObjectId().toString();
  let petId: string;
  let createdVisitId: string;
  let createdConditionId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }

    const pet = await petService.createPet(ownerId, {
      name: 'Oliver',
      species: 'cat',
      breed: 'British Shorthair',
      weight: 4.8,
    });
    petId = pet._id.toString();
  });

  afterAll(async () => {
    if (petId) {
      await petService.deletePet(petId, ownerId, false);
    }
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe('1. Medical Visits & Records', () => {
    it('creates a medical visit record for the owned pet', async () => {
      const visit = await healthService.createVisit(petId, ownerId, false, {
        visitType: 'routine_checkup',
        visitDate: new Date().toISOString().split('T')[0],
        visitReason: 'General dental check',
        vetName: 'Dr. Emily Watson',
        clinicName: 'Paws & Claws Veterinary',
        doctorNotes: 'Mild gingivitis noted on rear molars',
      });

      expect(visit).toBeDefined();
      expect(visit._id).toBeDefined();
      expect(visit.petId.toString()).toBe(petId);
      expect(visit.doctorNotes).toContain('Mild gingivitis');
      createdVisitId = visit._id.toString();
    });

    it('rejects visit creation from an unauthorized user (wrong owner)', async () => {
      await expect(
        healthService.createVisit(petId, unauthorizedUserId, false, {
          visitType: 'emergency',
          visitDate: new Date().toISOString().split('T')[0],
          visitReason: 'Unauthorized test',
        })
      ).rejects.toThrow(ForbiddenError);
    });

    it('retrieves visit by ID with ownership assertion', async () => {
      const visit = await healthService.getVisitById(petId, createdVisitId, ownerId, false);
      expect(visit).toBeDefined();
      expect(visit._id.toString()).toBe(createdVisitId);

      // Unauthorized retrieval attempt
      await expect(
        healthService.getVisitById(petId, createdVisitId, unauthorizedUserId, false)
      ).rejects.toThrow(ForbiddenError);
    });

    it('updates visit notes and records', async () => {
      const updated = await healthService.updateVisit(petId, createdVisitId, ownerId, false, {
        doctorNotes: 'Resolved gingivitis after 2 weeks of treatment.',
      });

      expect(updated).toBeDefined();
      expect(updated.doctorNotes).toContain('Resolved gingivitis');
    });
  });

  describe('2. Vital Logs & Tracking', () => {
    it('logs vitals and calculates latest vitals snapshot', async () => {
      const log = await healthService.logVital(petId, ownerId, false, {
        weight: 4.9,
        temperature: 38.5,
        pulse: 120,
        respiratoryRate: 24,
        notes: 'Calm during measurement',
      });

      expect(log).toBeDefined();
      expect(log.weight).toBe(4.9);
      expect(log.temperature).toBe(38.5);

      const latest = await healthService.getLatestVitals(petId, ownerId, false);
      expect(latest).toBeDefined();
      expect(latest?.weight).toBe(4.9);
      expect(latest?.temperature).toBe(38.5);
    });
  });

  describe('3. Chronic Conditions Management', () => {
    it('diagnoses a condition and resolves it', async () => {
      const condition = await healthService.addCondition(petId, ownerId, false, {
        name: 'Feline Asthma',
        diagnosedDate: new Date().toISOString().split('T')[0],
        severity: 'mild',
        acuteOrChronic: 'chronic',
      });

      expect(condition).toBeDefined();
      expect(condition.name).toBe('Feline Asthma');
      expect(condition.status).toBe('active');
      createdConditionId = condition._id.toString();

      // Resolve condition
      const resolved = await healthService.updateCondition(petId, createdConditionId, ownerId, false, {
        status: 'resolved',
      });
      expect(resolved).toBeDefined();
      expect(resolved.status).toBe('resolved');
    });
  });

  describe('4. Allergy Identification & Alerts', () => {
    it('records an allergy with emergency flag and retrieves allergy list', async () => {
      const allergy = await healthService.addAllergy(petId, ownerId, false, {
        allergen: 'Penicillin',
        allergenType: 'medication',
        severity: 'severe',
        isEmergencyFlag: true,
        reaction: 'Hives and facial swelling',
      });

      expect(allergy).toBeDefined();
      expect(allergy.allergen).toBe('Penicillin');
      expect(allergy.isEmergencyFlag).toBe(true);

      const allergies = await healthService.getAllergies(petId, ownerId, false);
      expect(allergies.some((a) => a.allergen === 'Penicillin')).toBe(true);
    });
  });

  describe('5. Health Dashboard & Telemetry Score', () => {
    it('computes holistic health dashboard, vitals, and health score', async () => {
      const dashboard = await healthService.getHealthDashboard(petId, ownerId, false);
      expect(dashboard).toBeDefined();
      expect(dashboard.latestVitals).toBeDefined();
      expect(dashboard.healthScore).toBeDefined();
      expect(typeof dashboard.healthScore.score).toBe('number');
      expect(dashboard.healthScore.score).toBeGreaterThanOrEqual(0);
      expect(dashboard.healthScore.score).toBeLessThanOrEqual(100);
      expect(Array.isArray(dashboard.alerts)).toBe(true);
    });
  });
});
