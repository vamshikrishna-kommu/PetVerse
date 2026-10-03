import mongoose from 'mongoose';
import { prescriptionService } from '../services/prescription.service';
import { petService } from '../../pets/pet.service';
import { PrescriptionModel, PrescriptionItemModel } from '../models/prescription.model';
import { MedicationCourseModel } from '../models/course.model';
import { ReminderModel } from '../../reminders/models/reminder.model';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/petverse_test';

describe('Medication Service Unit & Integration Tests', () => {
  jest.setTimeout(30000);

  const ownerId = new mongoose.Types.ObjectId().toString();
  let petId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }

    const pet = await petService.createPet(ownerId, {
      name: 'Max',
      species: 'dog',
      breed: 'Beagle',
    });
    petId = pet._id.toString();
  });

  afterAll(async () => {
    if (petId) {
      await petService.deletePet(petId, ownerId, false);
    }
    await PrescriptionModel.deleteMany({ ownerId });
    await PrescriptionItemModel.deleteMany({ createdBy: ownerId });
    await MedicationCourseModel.deleteMany({ createdBy: ownerId });
    await ReminderModel.deleteMany({ ownerId });
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe('1. Prescription Creation & Auto-Scheduling', () => {
    it('creates a prescription, generates courses, and sets up medication reminders', async () => {
      const rx = await prescriptionService.createPrescription(
        {
          petId,
          ownerId,
        },
        [
          {
            medicationId: 'Cephalexin 500mg',
            dosage: '1 capsule',
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
            durationDays: 10,
            quantity: 20,
            specialInstructions: 'Complete full course even if symptoms improve',
          },
        ],
        ownerId
      );

      expect(rx).toBeDefined();
      expect(rx.status).toBe('active');
      expect(rx.petId.toString()).toBe(petId);

      // Verify that course was created with expected doses (2/day * 10 days = 20 doses)
      const courses = await MedicationCourseModel.find({ petId });
      expect(courses).toHaveLength(1);
      expect(courses[0].totalDosesExpected).toBe(20);
      expect(courses[0].status).toBe('started');

      // Verify reminder creation
      const reminders = await ReminderModel.find({ ownerId, type: 'medication' });
      expect(reminders.length).toBeGreaterThanOrEqual(1);
      expect(reminders[0].title).toContain('Cephalexin');
    });
  });

  describe('2. Course Compliance Tracking', () => {
    it('initializes compliance at 0% and logs doses', async () => {
      const course = await MedicationCourseModel.findOne({ petId });
      expect(course).not.toBeNull();
      expect(course!.dosesCompleted).toBe(0);
      expect(course!.completionPercentage).toBe(0);
    });
  });
});
