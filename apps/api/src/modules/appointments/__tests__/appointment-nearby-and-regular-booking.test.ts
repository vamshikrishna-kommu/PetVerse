import mongoose from 'mongoose';
import { appointmentService } from '../services/appointment.service';
import { AppointmentModel } from '../models/appointment.model';
import { petService } from '../../pets/pet.service';
import { bookAppointmentSchema } from '../../../shared/validation/schemas';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/petverse_test';

describe('Appointment Booking: Nearby Clinics & Regular Flow', () => {
  jest.setTimeout(30000);

  const testOwnerId = new mongoose.Types.ObjectId().toString();
  let testPetId: string;
  const bookingDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }
    await AppointmentModel.deleteMany({ ownerId: testOwnerId });
    await AppointmentModel.deleteMany({ clinicId: 'osm:hyd:001' });

    const pet = await petService.createPet(testOwnerId, {
      name: 'BookingFlowPet',
      species: 'dog',
    });
    testPetId = pet._id;
  });

  afterAll(async () => {
    await AppointmentModel.deleteMany({ ownerId: testOwnerId });
    await AppointmentModel.deleteMany({ clinicId: 'osm:hyd:001' });
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe('Validation Schema (bookAppointmentSchema)', () => {
    it('accepts nearby location booking with OpenStreetMap clinic ID', () => {
      const parsed = bookAppointmentSchema.safeParse({
        petId: testPetId,
        clinicId: 'osm:hyd:001',
        clinicName: 'Government Veterinary Hospital (Super Specialty)',
        clinicAddress: 'Station Road, Beside Nampally Railway Station, Nampally, Hyderabad',
        appointmentDate: bookingDate,
        startTime: '10:00',
        type: 'checkup',
        notes: 'Routine vaccination checkup',
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.clinicId).toBe('osm:hyd:001');
        expect(parsed.data.clinicName).toBe('Government Veterinary Hospital (Super Specialty)');
      }
    });

    it('accepts nearby location booking with Google Places clinic ID', () => {
      const parsed = bookAppointmentSchema.safeParse({
        petId: testPetId,
        clinicId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
        appointmentDate: bookingDate,
        startTime: '11:30',
        type: 'consultation',
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.clinicId).toBe('ChIJN1t_tDeuEmsRUsoyG83frY4');
      }
    });

    it('accepts regular booking without clinicId', () => {
      const parsed = bookAppointmentSchema.safeParse({
        petId: testPetId,
        appointmentDate: bookingDate,
        startTime: '14:00',
        type: 'checkup',
        notes: 'General checkup',
      });
      expect(parsed.success).toBe(true);
      if (parsed.success) {
        expect(parsed.data.clinicId).toBeUndefined();
      }
    });
  });

  describe('Appointment Service Creation & Storage', () => {
    it('successfully books appointment via nearby OSM clinic ID and resolves clinic name', async () => {
      const appt = await appointmentService.bookAppointment(testOwnerId, {
        petId: testPetId,
        clinicId: 'osm:hyd:001',
        appointmentDate: bookingDate,
        startTime: '10:00',
        type: 'checkup',
        notes: 'Need full health exam',
      });

      expect(appt).toBeDefined();
      expect(appt._id).toBeDefined();
      expect(appt.clinicId).toBe('osm:hyd:001');
      expect(appt.clinicName).toBe('Government Veterinary Hospital (Super Specialty)');
      expect(appt.status).toBe('scheduled');

      // Verify in DB
      const dbDoc = await AppointmentModel.findById(appt._id).lean();
      expect(dbDoc).toBeDefined();
      expect(dbDoc?.clinicId).toBe('osm:hyd:001');
      expect(dbDoc?.clinicName).toBe('Government Veterinary Hospital (Super Specialty)');
    });

    it('successfully books a regular appointment without clinic', async () => {
      const appt = await appointmentService.bookAppointment(testOwnerId, {
        petId: testPetId,
        appointmentDate: bookingDate,
        startTime: '14:00',
        type: 'consultation',
        notes: 'General checkup without specific clinic',
      });

      expect(appt).toBeDefined();
      expect(appt._id).toBeDefined();
      expect(appt.clinicId).toBeUndefined();
      expect(appt.status).toBe('scheduled');

      // Verify in DB
      const dbDoc = await AppointmentModel.findById(appt._id).lean();
      expect(dbDoc).toBeDefined();
      expect(dbDoc?.clinicId).toBeUndefined();
    });

    it('successfully fetches available slots for nearby clinic and regular flow', async () => {
      const slotsWithClinic = await appointmentService.getAvailableSlots('osm:hyd:001', bookingDate);
      expect(Array.isArray(slotsWithClinic)).toBe(true);
      // '10:00' was booked above, so it should not be in available slots for osm:hyd:001
      expect(slotsWithClinic).not.toContain('10:00');

      const regularSlots = await appointmentService.getAvailableSlots(undefined, bookingDate);
      expect(Array.isArray(regularSlots)).toBe(true);
      expect(regularSlots.length).toBeGreaterThan(0);
    });

    it('prevents double-booking for the same clinic and time slot', async () => {
      await expect(
        appointmentService.bookAppointment(testOwnerId, {
          petId: testPetId,
          clinicId: 'osm:hyd:001',
          appointmentDate: bookingDate,
          startTime: '10:00', // Already booked
          type: 'checkup',
        })
      ).rejects.toThrow('This appointment slot is no longer available.');
    });
  });
});
