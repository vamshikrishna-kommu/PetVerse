/**
 * BUG-04 & BUG-05 Regression Tests
 *
 * BUG-04:
 * - Production seed protection: seedClinicsIfEmpty cannot seed fake clinics in production
 * - Development/test can seed clinics when empty
 *
 * BUG-05:
 * - Explicit appointment fee is preserved
 * - Zero fee ($0) remains zero
 * - Missing fee does not become $50
 */

import mongoose from 'mongoose';
import { ClinicModel } from '../models/clinic.model';
import { AppointmentModel } from '../models/appointment.model';
import { appointmentService } from '../services/appointment.service';
import { nearbyService } from '../../nearby/services/nearby.service';
import { petService } from '../../pets/pet.service';
import { env } from '../../../config/env';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/petverse_test';

describe('BUG-04 & BUG-05: Seed Protection & Appointment Fee Handling', () => {
  jest.setTimeout(30000);

  const testOwnerId = new mongoose.Types.ObjectId().toString();
  let testPetId: string;
  let testClinicId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }

    // Create a pet for appointment booking tests
    const pet = await petService.createPet(testOwnerId, {
      name: 'FeeTestPet',
      species: 'dog',
    });
    testPetId = pet._id;

    // Ensure at least one test clinic exists
    let clinic = await ClinicModel.findOne();
    if (!clinic) {
      clinic = await ClinicModel.create({
        name: 'Test Dedicated Hospital',
        ownerId: new mongoose.Types.ObjectId(),
        type: 'veterinary_clinic',
        address: '10, Residency Road, Bengaluru, KA 560025',
        location: { type: 'Point', coordinates: [77.5946, 12.9716] },
        phone: '+91 80 4000 0000',
        services: ['Checkup'],
        ratings: { avg: 5.0, count: 1 },
        isVerified: true,
      });
    }
    testClinicId = clinic._id.toString();
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  // ────────────────────────────────────────────────────────────
  // BUG-04: Production Seed Protection
  // ────────────────────────────────────────────────────────────
  describe('BUG-04: Production Seed Protection', () => {
    const originalNodeEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalNodeEnv;
    });

    it('Automatic clinic seeding CANNOT execute when NODE_ENV is production', async () => {
      process.env.NODE_ENV = 'production';

      // Temporarily clear clinics collection
      await ClinicModel.deleteMany({});
      const countBefore = await ClinicModel.countDocuments();
      expect(countBefore).toBe(0);

      // Attempt to seed clinics
      await nearbyService.seedClinicsIfEmpty();

      // In production, no clinics should be created
      const countAfter = await ClinicModel.countDocuments();
      expect(countAfter).toBe(0);

      // getNearbyServices also does not insert fake clinics in production
      const result = await nearbyService.getNearbyServices({ lat: 37.7749, lng: -122.4194, radiusKm: 25 });
      expect(result.data.length).toBe(0);
      expect(await ClinicModel.countDocuments()).toBe(0);
    });

    it('Seeding succeeds when not in production (development/test)', async () => {
      process.env.NODE_ENV = 'test';

      await nearbyService.seedClinicsIfEmpty();

      const count = await ClinicModel.countDocuments();
      expect(count).toBeGreaterThan(0);

      // Update testClinicId with the seeded clinic for subsequent tests
      const clinic = await ClinicModel.findOne();
      testClinicId = clinic!._id.toString();
    });
  });

  // ────────────────────────────────────────────────────────────
  // BUG-05: Remove Hardcoded Appointment Fee
  // ────────────────────────────────────────────────────────────
  describe('BUG-05: Appointment Fee Semantics', () => {
    const baseDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    it('Explicit fee is preserved accurately', async () => {
      const appt = await appointmentService.bookAppointment(testOwnerId, {
        petId: testPetId,
        clinicId: testClinicId,
        appointmentDate: baseDate,
        startTime: '09:00',
        type: 'checkup',
        fee: 85,
      });

      expect(appt.fee).toBe(85);

      const dbDoc = await AppointmentModel.findById(appt._id).lean();
      expect(dbDoc?.fee).toBe(85);
    });

    it('Zero fee remains zero ($0 is not replaced by $50)', async () => {
      const appt = await appointmentService.bookAppointment(testOwnerId, {
        petId: testPetId,
        clinicId: testClinicId,
        appointmentDate: baseDate,
        startTime: '09:30',
        type: 'checkup',
        fee: 0,
      });

      expect(appt.fee).toBe(0);

      const dbDoc = await AppointmentModel.findById(appt._id).lean();
      expect(dbDoc?.fee).toBe(0);
    });

    it('Missing fee remains undefined/null and does NOT become $50', async () => {
      const appt = await appointmentService.bookAppointment(testOwnerId, {
        petId: testPetId,
        clinicId: testClinicId,
        appointmentDate: baseDate,
        startTime: '10:00',
        type: 'checkup',
      });

      expect(appt.fee).toBeUndefined();

      const dbDoc = await AppointmentModel.findById(appt._id).lean();
      expect(dbDoc?.fee).toBeUndefined();
    });
  });
});
