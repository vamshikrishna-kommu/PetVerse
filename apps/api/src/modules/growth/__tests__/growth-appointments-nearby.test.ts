import { growthService } from '../services/growth.service';
import { appointmentService } from '../../appointments/services/appointment.service';
import { nearbyService } from '../../nearby/services/nearby.service';
import { petService } from '../../pets/pet.service';
import { ConflictError } from '../../../shared/errors/AppError';
import mongoose from 'mongoose';

describe('PetVerse Growth, Appointments & Nearby Integration Tests', () => {
  jest.setTimeout(30000);
  const userAId = new mongoose.Types.ObjectId().toString();
  let createdPetId: string;
  let clinicId: string;
  let bookedApptId: string;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/petverse_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  it('1. Create Growth Log & verify pet weight update + analytics', async () => {
    const pet = await petService.createPet(userAId, {
      name: 'Max',
      species: 'dog',
      weight: 12.0,
    });
    createdPetId = pet._id;

    // Log growth measurement
    const log = await growthService.addGrowthLog(createdPetId, userAId, {
      weight: 14.5,
      height: 48,
      notes: 'Healthy weight gain',
    });

    expect(log).toBeDefined();
    expect(log.weight).toBe(14.5);

    // Verify analytics calculation
    const analytics = await growthService.getGrowthAnalytics(createdPetId, userAId);
    expect(analytics.currentWeight).toBe(14.5);
    expect(analytics.measurementCount).toBeGreaterThanOrEqual(1);

    // Verify master PetModel weight updated
    const updatedPet = await petService.getPetById(createdPetId, userAId);
    expect(updatedPet.weight).toBe(14.5);
  });

  it('2. Seed & Query Nearby Clinics with Geospatial 2dsphere indexing', async () => {
    const result = await nearbyService.getNearbyServices({
      lat: 12.9600,
      lng: 77.6376,
      radiusKm: 25,
    });

    expect(result).toBeDefined();
    expect(result.data.length).toBeGreaterThan(0);
    clinicId = result.data[0]._id;
    expect(clinicId).toBeDefined();
  });

  it('3. Generate Available Slots & Book Appointment', async () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const slots = await appointmentService.getAvailableSlots(clinicId, tomorrow);
    expect(slots).toBeDefined();
    expect(slots.length).toBeGreaterThan(0);

    const selectedSlot = slots[0];

    const appt = await appointmentService.bookAppointment(userAId, {
      petId: createdPetId,
      clinicId,
      appointmentDate: tomorrow,
      startTime: selectedSlot,
      type: 'checkup',
      notes: 'Annual checkup for Max',
    });

    expect(appt).toBeDefined();
    expect(appt.appointmentDate).toBe(tomorrow);
    expect(appt.startTime).toBe(selectedSlot);
    bookedApptId = appt._id;
  });

  it('4. Double-Booking Conflict Protection: Rejects duplicate booking for same slot', async () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const appt = await appointmentService.getAppointmentById(bookedApptId, userAId);

    // Attempting to book same slot for same clinic & date must throw ConflictError
    await expect(
      appointmentService.bookAppointment(userAId, {
        petId: createdPetId,
        clinicId,
        appointmentDate: tomorrow,
        startTime: appt.startTime!,
        type: 'vaccination',
      })
    ).rejects.toThrow(ConflictError);
  });

  it('5. Post Review for Clinic & verify rating average recalculation', async () => {
    const review = await nearbyService.addReview(clinicId, userAId, {
      rating: 5,
      comment: 'Excellent care and friendly staff!',
    });

    expect(review).toBeDefined();
    expect(review.rating).toBe(5);

    const clinic = await nearbyService.getClinicById(clinicId);
    expect(clinic.ratings.count).toBeGreaterThan(0);
    expect(clinic.ratings.avg).toBeGreaterThanOrEqual(1);
  });

  it('6. Cancel Appointment', async () => {
    const cancelled = await appointmentService.cancelAppointment(bookedApptId, userAId, 'Rescheduled');
    expect(cancelled.status).toBe('cancelled');
  });
});
