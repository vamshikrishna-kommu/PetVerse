/**
 * P0-4: Validation schema unit tests
 *
 * Verifies that Zod schemas correctly reject invalid inputs and accept valid ones.
 * These are pure unit tests — no DB or HTTP required.
 */

import {
  createReminderSchema,
  bookAppointmentSchema,
  updateProfileSchema,
  addReviewSchema,
  recordVaccinationSchema,
  snoozeReminderSchema,
  cancelAppointmentSchema,
  createGrowthLogSchema,
} from '../../../shared/validation/schemas';

describe('P0-4: Zod Validation Schemas', () => {
  // ─── Reminder ────────────────────────────────────────────
  describe('createReminderSchema', () => {
    it('accepts valid reminder', () => {
      const result = createReminderSchema.safeParse({
        petId: 'a'.repeat(24),
        type: 'medication',
        title: 'Give meds',
        frequency: 'daily',
        nextTrigger: new Date(Date.now() + 86400000).toISOString(),
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid petId (too short)', () => {
      const result = createReminderSchema.safeParse({
        petId: 'short',
        type: 'medication',
        title: 'Give meds',
        frequency: 'daily',
        nextTrigger: new Date().toISOString(),
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid type', () => {
      const result = createReminderSchema.safeParse({
        petId: 'a'.repeat(24),
        type: 'invalid_type',
        title: 'Give meds',
        frequency: 'daily',
        nextTrigger: new Date().toISOString(),
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing required fields', () => {
      const result = createReminderSchema.safeParse({ title: 'Give meds' });
      expect(result.success).toBe(false);
    });
  });

  // ─── Appointment ─────────────────────────────────────────
  describe('bookAppointmentSchema', () => {
    const validDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    it('accepts valid appointment booking', () => {
      const result = bookAppointmentSchema.safeParse({
        petId: 'b'.repeat(24),
        appointmentDate: validDate,
        startTime: '10:30',
        type: 'checkup',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid startTime format', () => {
      const result = bookAppointmentSchema.safeParse({
        petId: 'b'.repeat(24),
        appointmentDate: validDate,
        startTime: '10:30 AM', // wrong format
        type: 'checkup',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid date format', () => {
      const result = bookAppointmentSchema.safeParse({
        petId: 'b'.repeat(24),
        appointmentDate: '2024/01/15', // wrong separator
        startTime: '10:30',
        type: 'checkup',
      });
      expect(result.success).toBe(false);
    });

    it('rejects unknown appointment type', () => {
      const result = bookAppointmentSchema.safeParse({
        petId: 'b'.repeat(24),
        appointmentDate: validDate,
        startTime: '10:30',
        type: 'spa_day',
      });
      expect(result.success).toBe(false);
    });

    it('accepts zero fee (free appointment)', () => {
      const result = bookAppointmentSchema.safeParse({
        petId: 'b'.repeat(24),
        appointmentDate: validDate,
        startTime: '10:30',
        type: 'checkup',
        fee: 0,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fee).toBe(0);
      }
    });

    it('accepts positive explicit fee', () => {
      const result = bookAppointmentSchema.safeParse({
        petId: 'b'.repeat(24),
        appointmentDate: validDate,
        startTime: '10:30',
        type: 'checkup',
        fee: 75.5,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fee).toBe(75.5);
      }
    });

    it('accepts missing fee without error', () => {
      const result = bookAppointmentSchema.safeParse({
        petId: 'b'.repeat(24),
        appointmentDate: validDate,
        startTime: '10:30',
        type: 'checkup',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fee).toBeUndefined();
      }
    });

    it('rejects negative fee', () => {
      const result = bookAppointmentSchema.safeParse({
        petId: 'b'.repeat(24),
        appointmentDate: validDate,
        startTime: '10:30',
        type: 'checkup',
        fee: -15,
      });
      expect(result.success).toBe(false);
    });

    it('accepts external clinic IDs (such as OpenStreetMap and Google Places IDs)', () => {
      const osmResult = bookAppointmentSchema.safeParse({
        petId: 'b'.repeat(24),
        clinicId: 'osm:hyd:001',
        clinicName: 'Olive Pet Clinic',
        appointmentDate: validDate,
        startTime: '10:30',
        type: 'checkup',
      });
      expect(osmResult.success).toBe(true);

      const googleResult = bookAppointmentSchema.safeParse({
        petId: 'b'.repeat(24),
        clinicId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
        appointmentDate: validDate,
        startTime: '10:30',
        type: 'checkup',
      });
      expect(googleResult.success).toBe(true);
    });

    it('normalizes empty string or null clinicId to undefined', () => {
      const result = bookAppointmentSchema.safeParse({
        petId: 'b'.repeat(24),
        clinicId: '',
        appointmentDate: validDate,
        startTime: '10:30',
        type: 'checkup',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.clinicId).toBeUndefined();
      }
    });
  });

  // ─── Cancel Appointment ───────────────────────────────────
  describe('cancelAppointmentSchema', () => {
    it('accepts empty body (reason is optional)', () => {
      expect(cancelAppointmentSchema.safeParse({}).success).toBe(true);
    });

    it('rejects reason longer than 500 chars', () => {
      const result = cancelAppointmentSchema.safeParse({ reason: 'x'.repeat(501) });
      expect(result.success).toBe(false);
    });
  });

  // ─── Profile ─────────────────────────────────────────────
  describe('updateProfileSchema', () => {
    it('accepts partial update', () => {
      expect(updateProfileSchema.safeParse({ firstName: 'Alice' }).success).toBe(true);
    });

    it('rejects empty firstName', () => {
      expect(updateProfileSchema.safeParse({ firstName: '' }).success).toBe(false);
    });

    it('rejects invalid phone number', () => {
      expect(updateProfileSchema.safeParse({ phone: 'not-a-phone' }).success).toBe(false);
    });

    it('accepts valid E.164 phone number', () => {
      expect(updateProfileSchema.safeParse({ phone: '+14155552671' }).success).toBe(true);
    });
  });

  // ─── Review ──────────────────────────────────────────────
  describe('addReviewSchema', () => {
    it('accepts valid review', () => {
      expect(addReviewSchema.safeParse({ rating: 5, comment: 'Great!' }).success).toBe(true);
    });

    it('rejects rating out of range', () => {
      expect(addReviewSchema.safeParse({ rating: 6, comment: 'Too good' }).success).toBe(false);
      expect(addReviewSchema.safeParse({ rating: 0, comment: 'Bad' }).success).toBe(false);
    });

    it('rejects missing comment', () => {
      expect(addReviewSchema.safeParse({ rating: 3 }).success).toBe(false);
    });
  });

  // ─── Vaccination ─────────────────────────────────────────
  describe('recordVaccinationSchema', () => {
    it('accepts valid vaccination record', () => {
      const result = recordVaccinationSchema.safeParse({
        vaccineId: 'c'.repeat(24),
        status: 'completed',
        currentDoseNumber: 1,
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid status', () => {
      const result = recordVaccinationSchema.safeParse({
        vaccineId: 'c'.repeat(24),
        status: 'maybe',
      });
      expect(result.success).toBe(false);
    });
  });

  // ─── Snooze ──────────────────────────────────────────────
  describe('snoozeReminderSchema', () => {
    it('accepts valid snooze hours', () => {
      expect(snoozeReminderSchema.safeParse({ hours: 2 }).success).toBe(true);
    });

    it('rejects 0 hours', () => {
      expect(snoozeReminderSchema.safeParse({ hours: 0 }).success).toBe(false);
    });

    it('rejects more than 168 hours (1 week)', () => {
      expect(snoozeReminderSchema.safeParse({ hours: 169 }).success).toBe(false);
    });
  });

  // ─── Growth ──────────────────────────────────────────────
  describe('createGrowthLogSchema', () => {
    it('accepts valid growth log', () => {
      expect(createGrowthLogSchema.safeParse({ weight: 12.5, height: 45 }).success).toBe(true);
    });

    it('rejects negative weight', () => {
      expect(createGrowthLogSchema.safeParse({ weight: -1 }).success).toBe(false);
    });
  });
});
