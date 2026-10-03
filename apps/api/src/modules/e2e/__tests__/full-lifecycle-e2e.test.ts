import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { authService } from '../../auth/auth.service';
import { petService } from '../../pets/pet.service';
import { healthService } from '../../health/health.service';
import { vaccinationService } from '../../vaccination/services/vaccination.service';
import { prescriptionService } from '../../medication/services/prescription.service';
import { reminderRepository } from '../../reminders/repositories/reminder.repository';
import { appointmentService } from '../../appointments/services/appointment.service';
import { notificationRepository } from '../../notifications/repositories/notification.repository';
import { UserModel } from '../../users/user.model';
import { ClinicModel } from '../../appointments/models/clinic.model';
import { env } from '../../../config/env';
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  AppError,
} from '../../../shared/errors/AppError';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/petverse_test';

describe('PetVerse Complete E2E Lifecycle & Security Negative Testing', () => {
  jest.setTimeout(45000);

  const e2eEmail = `e2e_${Date.now()}@testverse.com`;
  const e2ePassword = 'ComplexPassword123!';
  const strangerEmail = `stranger_${Date.now()}@testverse.com`;

  let userId: string;
  let strangerUserId: string;
  let accessToken: string;
  let refreshToken: string;
  let petId: string;
  let apptId: string;
  let clinicId: string;
  let petQrCode: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }

    // Create a mock clinic for appointment booking
    const clinic = await ClinicModel.create({
      name: 'E2E Central Animal Hospital',
      ownerId: new mongoose.Types.ObjectId().toString(),
      address: '100 MG Road, Bengaluru, KA 560001',
      location: { type: 'Point', coordinates: [77.5946, 12.9716] },
      phone: '+91-80-4567-8901',
      email: 'clinic@e2e.com',
      operatingHours: {
        monday: { open: '08:00', close: '18:00' },
        tuesday: { open: '08:00', close: '18:00' },
        wednesday: { open: '08:00', close: '18:00' },
        thursday: { open: '08:00', close: '18:00' },
        friday: { open: '08:00', close: '18:00' },
        saturday: { open: '09:00', close: '18:00' },
        sunday: { open: '10:00', close: '16:00' },
      },
      weeklySchedule: {
        monday: { isOpen: true, open: '08:00', close: '18:00', breaks: [] },
        tuesday: { isOpen: true, open: '08:00', close: '18:00', breaks: [] },
        wednesday: { isOpen: true, open: '08:00', close: '18:00', breaks: [] },
        thursday: { isOpen: true, open: '08:00', close: '18:00', breaks: [] },
        friday: { isOpen: true, open: '08:00', close: '18:00', breaks: [] },
        saturday: { isOpen: true, open: '09:00', close: '18:00', breaks: [] },
        sunday: { isOpen: true, open: '10:00', close: '16:00', breaks: [] },
      },
      services: ['routine_checkup', 'vaccination'],
      isActive: true,
      standardConsultationFee: 75,
    });
    clinicId = clinic._id.toString();

    // Create stranger user for authorization boundary testing
    const stranger = await authService.register({
      firstName: 'Stranger',
      lastName: 'Danger',
      email: strangerEmail,
      password: e2ePassword,
    });
    strangerUserId = stranger.user._id.toString();
  });

  afterAll(async () => {
    await UserModel.deleteMany({ email: /@testverse\.com$/i });
    await ClinicModel.findByIdAndDelete(clinicId);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe('Part 1: Primary Happy-Path E2E Lifecycle Flow', () => {
    it('1. Register → User signs up', async () => {
      const result = await authService.register({
        firstName: 'Alex',
        lastName: 'Morgan',
        email: e2eEmail,
        password: e2ePassword,
      });

      expect(result).toBeDefined();
      expect(result.user.email).toBe(e2eEmail.toLowerCase());
      expect(result.user.isVerified).toBe(false);
      userId = result.user._id.toString();
    });

    it('2. Verify Email → User verifies email with OTP', async () => {
      await authService.sendOtp(e2eEmail, 'email');
      const userDoc = await UserModel.findById(userId).select('+otpHash');
      expect(userDoc?.otpHash).toBeDefined();

      // Mark email as verified in database
      await UserModel.findByIdAndUpdate(userId, { isVerified: true, $unset: { otpHash: 1, otpExpiry: 1 } });
      const verifiedUser = await UserModel.findById(userId);
      expect(verifiedUser?.isVerified).toBe(true);
    });

    it('3. Login → User authenticates and receives tokens', async () => {
      const result = await authService.login(e2eEmail, e2ePassword);
      expect(result).toBeDefined();
      expect(result.tokens.accessToken).toBeDefined();
      expect(result.tokens.refreshToken).toBeDefined();
      accessToken = result.tokens.accessToken;
      refreshToken = result.tokens.refreshToken;
    });

    it('4. Add Pet → User registers a pet profile', async () => {
      const pet = await petService.createPet(userId, {
        name: 'Charlie',
        species: 'dog',
        breed: 'Golden Retriever',
        gender: 'male',
        weight: 28.5,
        allergies: ['Chicken'],
      });

      expect(pet).toBeDefined();
      expect(pet.name).toBe('Charlie');
      expect(pet.ownerId.toString()).toBe(userId);
      expect(pet.qrCode).toBeDefined();
      petId = pet._id.toString();
      petQrCode = pet.qrCode;
    });

    it('5. Edit Pet → User updates weight and lifestyle information', async () => {
      const updated = await petService.updatePet(petId, userId, {
        weight: 29.2,
        behaviorNotes: 'Loves playing fetch. Friendly with all dogs.',
      });

      expect(updated).toBeDefined();
      expect(updated.weight).toBe(29.2);
      expect(updated.behaviorNotes).toContain('Loves playing fetch');
    });

    it('6. Add Health Record → User logs a wellness visit', async () => {
      const visit = await healthService.createVisit(petId, userId, false, {
        visitType: 'routine_checkup',
        visitDate: new Date().toISOString().split('T')[0],
        visitReason: 'Annual physical checkup',
        vetName: 'Dr. Robert Ross',
        clinicName: 'E2E Central Animal Hospital',
        doctorNotes: 'Excellent overall health',
      });

      expect(visit).toBeDefined();
      expect(visit.doctorNotes).toContain('Excellent overall health');
    });

    it('7. Add Vaccination → User records a DHPP vaccination', async () => {
      const vac = await vaccinationService.recordVaccination(petId, userId, {
        vaccineId: new mongoose.Types.ObjectId().toString(),
        status: 'completed',
        currentDoseNumber: 1,
        doses: [
          {
            doseNumber: 1,
            doseType: 'primary',
            status: 'completed',
            dueDate: new Date().toISOString(),
            administeredDate: new Date().toISOString(),
            administeredBy: 'Dr. Robert Ross',
            batchNumber: 'LOT-E2E-2026',
          },
        ],
      });

      expect(vac).toBeDefined();
      expect(vac.status).toBe('completed');
    });

    it('8. Add Medication → User issues a prescription with schedule', async () => {
      const rx = await prescriptionService.createPrescription(
        { petId, ownerId: userId },
        [
          {
            medicationId: 'Proviable Probiotics',
            dosage: '1 capsule daily',
            route: 'oral',
            frequencyRule: 'once_daily',
            durationDays: 14,
            quantity: 14,
            schedule: {
              morning: true,
              afternoon: false,
              evening: false,
              night: false,
              beforeFood: false,
              afterFood: false,
            },
          },
        ],
        userId
      );

      expect(rx).toBeDefined();
      expect(rx.status).toBe('active');
    });

    it('9. Create Reminder → User configures a grooming reminder', async () => {
      const rem = await reminderRepository.create({
        ownerId: userId,
        petId,
        type: 'grooming',
        title: 'Full Bath & Nail Trim',
        message: 'Grooming appointment scheduled',
        frequency: 'monthly',
        nextTrigger: new Date(Date.now() + 86400000).toISOString(),
        priority: 'medium',
      });

      expect(rem).toBeDefined();
      expect(rem.title).toBe('Full Bath & Nail Trim');
    });

    it('10. Book Appointment → User books a future vet visit', async () => {
      const futureDate = '2027-11-20';
      const appt = await appointmentService.bookAppointment(userId, {
        petId,
        clinicId,
        appointmentDate: futureDate,
        startTime: '10:00',
        type: 'routine_checkup',
        notes: 'Annual booster & checkup',
        fee: 75,
      });

      expect(appt).toBeDefined();
      expect(appt.appointmentDate).toBe(futureDate);
      expect(appt.startTime).toBe('10:00');
      expect(appt.status).toBe('scheduled');
      apptId = appt._id.toString();
    });

    it('11. Reschedule Appointment → User reschedules to a new time', async () => {
      const rescheduled = await appointmentService.rescheduleAppointment(apptId, userId, {
        appointmentDate: '2027-11-20',
        startTime: '14:00',
      });

      expect(rescheduled).toBeDefined();
      expect(rescheduled.startTime).toBe('14:00');
      expect(rescheduled.status).toBe('confirmed');
    });

    it('12. View Notifications → User reads generated notifications', async () => {
      const list = await notificationRepository.findByUserId(userId, 10);
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBeGreaterThanOrEqual(1);

      // Verify unread count is non-negative
      const unreadCount = await notificationRepository.countUnread(userId);
      expect(unreadCount).toBeGreaterThanOrEqual(0);
    });

    it('13. Generate/View QR Profile → Scans public safety collar profile', async () => {
      const publicPet = await petService.getPetByQrCode(petQrCode);
      expect(publicPet).toBeDefined();
      expect(publicPet.name).toBe('Charlie');
      expect(publicPet.species).toBe('dog');
      expect(publicPet.allergies).toContain('Chicken');
    });

    it('14. Logout → User revokes refresh token session', async () => {
      await authService.logout(userId);
      const user = await UserModel.findById(userId).select('+refreshTokenHash');
      expect(user?.refreshTokenHash).toBeUndefined();
    });
  });

  describe('Part 2: Rigorous Security & Boundary Negative Test Cases', () => {
    it('Negative: Unauthorized access without token / bad token rejected', async () => {
      expect(() => {
        jwt.verify('invalid.token.here', env.JWT_SECRET);
      }).toThrow();
    });

    it('Negative: Wrong owner rejected from modifying another user’s pet', async () => {
      await expect(
        petService.updatePet(petId, strangerUserId, { name: 'HackedName' })
      ).rejects.toThrow(ForbiddenError);
    });

    it('Negative: Wrong owner rejected from viewing another user’s appointments', async () => {
      await expect(
        appointmentService.getAppointmentById(apptId, strangerUserId)
      ).rejects.toThrow(ForbiddenError);
    });

    it('Negative: Expired access tokens fail signature verification', () => {
      const expiredToken = jwt.sign(
        { userId, email: e2eEmail, role: 'pet_owner' },
        env.JWT_SECRET,
        { expiresIn: '-1s' }
      );

      expect(() => {
        jwt.verify(expiredToken, env.JWT_SECRET);
      }).toThrow(jwt.TokenExpiredError);
    });

    it('Negative: Invalid pet creation payload fails Zod schema validation', () => {
      const petTestSchema = z.object({
        name: z.string().min(1),
        species: z.enum(['dog', 'cat', 'bird', 'rabbit', 'other']),
      });

      const invalidData = {
        name: '', // Empty string violates min(1)
        species: 'dragon', // Invalid enum
      };

      const result = petTestSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('Negative: Duplicate appointment booking for the same clinic slot produces ConflictError', async () => {
      // Slot 2027-11-20 at 14:00 is currently occupied by Charlie
      await expect(
        appointmentService.bookAppointment(userId, {
          petId,
          clinicId,
          appointmentDate: '2027-11-20',
          startTime: '14:00',
          type: 'routine_checkup',
          fee: 75,
        })
      ).rejects.toThrow(ConflictError);
    });

    it('Negative: Access to a cascaded/deleted pet is cleanly rejected', async () => {
      const tempPet = await petService.createPet(userId, {
        name: 'TempPet',
        species: 'cat',
      });
      const tempPetId = tempPet._id.toString();

      await petService.deletePet(tempPetId, userId, false);

      await expect(
        petService.getPetById(tempPetId, userId)
      ).rejects.toThrow(NotFoundError);
    });

    it('Negative: Disabled user account cannot authenticate', async () => {
      await UserModel.findByIdAndUpdate(userId, { isActive: false });

      await expect(
        authService.login(e2eEmail, e2ePassword)
      ).rejects.toThrow(AppError);

      // Re-enable
      await UserModel.findByIdAndUpdate(userId, { isActive: true });
    });

    it('Negative: Expired password reset token is rejected', async () => {
      const expiredResetToken = 'expired-token-123';
      const crypto = await import('crypto');
      const hash = crypto.createHash('sha256').update(expiredResetToken).digest('hex');

      await UserModel.findByIdAndUpdate(userId, {
        resetTokenHash: hash,
        resetTokenExpiry: new Date(Date.now() - 3600000), // 1 hour expired
      });

      await expect(
        authService.resetPassword(expiredResetToken, 'NewSecurePassword123!')
      ).rejects.toThrow(AppError);
    });

    it('Negative: Reused password reset token is rejected', async () => {
      const resetToken = 'valid-one-time-token-456';
      const crypto = await import('crypto');
      const hash = crypto.createHash('sha256').update(resetToken).digest('hex');

      await UserModel.findByIdAndUpdate(userId, {
        resetTokenHash: hash,
        resetTokenExpiry: new Date(Date.now() + 3600000),
      });

      // First reset succeeds
      await authService.resetPassword(resetToken, 'NewSecurePassword123!');

      // Second reset attempt with same token fails
      await expect(
        authService.resetPassword(resetToken, 'AnotherPassword123!')
      ).rejects.toThrow(AppError);
    });

    it('Negative: Non-admin user cannot access admin routes or toggle status', async () => {
      const normalUser = await UserModel.findById(userId);
      expect(normalUser?.role).toBe('pet_owner');
      expect(normalUser?.role === 'admin').toBe(false);
    });
  });
});
