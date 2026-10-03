import mongoose from 'mongoose';
import { paymentService } from '../services/payment.service';
import { PaymentTransactionModel } from '../models/payment-transaction.model';
import { AppointmentModel } from '../../appointments/models/appointment.model';
import { ClinicModel } from '../../appointments/models/clinic.model';
import { petService } from '../../pets/pet.service';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/petverse_test';

describe('Phase 4 — Payment Gateway Server-Side Verification & Idempotency', () => {
  jest.setTimeout(30000);

  const ownerId = new mongoose.Types.ObjectId().toString();
  const otherUserId = new mongoose.Types.ObjectId().toString();
  let testPetId: string;
  let testClinicId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }

    const pet = await petService.createPet(ownerId, {
      name: 'PayPet',
      species: 'dog',
    });
    testPetId = pet._id;

    let clinic = await ClinicModel.findOne();
    if (!clinic) {
      clinic = await ClinicModel.create({
        name: 'Payment Test Clinic',
        ownerId: new mongoose.Types.ObjectId(),
        type: 'veterinary_clinic',
        address: '123 Pay St',
        location: { type: 'Point', coordinates: [-122.4194, 37.7749] },
        phone: '+1 555 123 4567',
        services: ['Checkup'],
        ratings: { avg: 5.0, count: 1 },
        isVerified: true,
      });
    }
    testClinicId = clinic._id.toString();
  });

  afterAll(async () => {
    await AppointmentModel.deleteMany({ ownerId });
    await PaymentTransactionModel.deleteMany({ ownerId });
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  it('should reject checkout session if appointment does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    await expect(paymentService.createCheckoutSession(ownerId, fakeId)).rejects.toThrow();
  });

  it('should reject checkout session if user is not the appointment owner', async () => {
    const appt = await AppointmentModel.create({
      petId: new mongoose.Types.ObjectId(testPetId),
      ownerId: new mongoose.Types.ObjectId(ownerId),
      clinicId: new mongoose.Types.ObjectId(testClinicId),
      appointmentDate: '2026-11-01',
      startTime: '10:00',
      type: 'checkup',
      status: 'scheduled',
      scheduledAt: new Date(),
      duration: 30,
      fee: 65,
      paymentStatus: 'pending',
    });

    await expect(
      paymentService.createCheckoutSession(otherUserId, appt._id.toString())
    ).rejects.toThrow(/own appointments/i);
  });

  it('should reject checkout session if appointment fee is 0 or missing', async () => {
    const freeAppt = await AppointmentModel.create({
      petId: new mongoose.Types.ObjectId(testPetId),
      ownerId: new mongoose.Types.ObjectId(ownerId),
      clinicId: new mongoose.Types.ObjectId(testClinicId),
      appointmentDate: '2026-11-02',
      startTime: '11:00',
      type: 'consultation',
      status: 'scheduled',
      scheduledAt: new Date(),
      duration: 30,
      fee: 0,
      paymentStatus: 'pending',
    });

    await expect(
      paymentService.createCheckoutSession(ownerId, freeAppt._id.toString())
    ).rejects.toThrow(/no payable fee/i);
  });

  it('should create checkout session and confirm payment server-side', async () => {
    const appt = await AppointmentModel.create({
      petId: new mongoose.Types.ObjectId(testPetId),
      ownerId: new mongoose.Types.ObjectId(ownerId),
      clinicId: new mongoose.Types.ObjectId(testClinicId),
      appointmentDate: '2026-11-03',
      startTime: '14:00',
      type: 'vaccination',
      status: 'scheduled',
      scheduledAt: new Date(),
      duration: 30,
      fee: 75,
      paymentStatus: 'pending',
    });

    // 1. Create checkout session
    const session = await paymentService.createCheckoutSession(ownerId, appt._id.toString());
    expect(session.transactionId).toBeDefined();
    expect(session.amount).toBe(75);
    expect(session.currency).toBe('INR');

    // Verify transaction record created with pending status
    const tx = await PaymentTransactionModel.findById(session.transactionId);
    expect(tx).not.toBeNull();
    expect(tx?.status).toBe('pending');
    expect(tx?.idempotencyKey).toBeDefined();

    // 2. Confirm payment server-side
    const confirmResult = await paymentService.confirmPayment(ownerId, session.transactionId);
    expect(confirmResult.success).toBe(true);
    expect(confirmResult.status).toBe('succeeded');

    // 3. Verify database updates
    const updatedAppt = await AppointmentModel.findById(appt._id);
    expect(updatedAppt?.paymentStatus).toBe('paid');

    const updatedTx = await PaymentTransactionModel.findById(session.transactionId);
    expect(updatedTx?.status).toBe('succeeded');
    expect(updatedTx?.providerPaymentId).toBeDefined();
  });

  it('should process webhooks idempotently without duplicate charges', async () => {
    const appt = await AppointmentModel.create({
      petId: new mongoose.Types.ObjectId(testPetId),
      ownerId: new mongoose.Types.ObjectId(ownerId),
      clinicId: new mongoose.Types.ObjectId(testClinicId),
      appointmentDate: '2026-11-04',
      startTime: '15:00',
      type: 'grooming',
      status: 'scheduled',
      scheduledAt: new Date(),
      duration: 30,
      fee: 45,
      paymentStatus: 'pending',
    });

    const session = await paymentService.createCheckoutSession(ownerId, appt._id.toString());
    const tx = await PaymentTransactionModel.findById(session.transactionId);
    const idempotencyKey = tx!.idempotencyKey;

    const webhookPayload = {
      type: 'checkout.session.completed',
      idempotencyKey,
      transactionId: session.transactionId,
      sessionId: session.sessionId,
      status: 'succeeded' as const,
    };

    // First webhook call: processes successfully
    const firstCall = await paymentService.processWebhook(webhookPayload);
    expect(firstCall.processed).toBe(true);

    // Second webhook call with identical idempotencyKey: returns idempotent response without duplicating
    const secondCall = await paymentService.processWebhook(webhookPayload);
    expect(secondCall.processed).toBe(true);
    expect(secondCall.idempotentReplay).toBe(true);
  });

  describe('Payment Gateway Failure Paths & Security Boundaries', () => {
    it('should reject checkout session when appointment is already paid', async () => {
      const paidAppt = await AppointmentModel.create({
        petId: new mongoose.Types.ObjectId(testPetId),
        ownerId: new mongoose.Types.ObjectId(ownerId),
        clinicId: new mongoose.Types.ObjectId(testClinicId),
        appointmentDate: '2026-11-05',
        startTime: '16:00',
        type: 'consultation',
        status: 'scheduled',
        scheduledAt: new Date(),
        duration: 30,
        fee: 50,
        paymentStatus: 'paid',
      });

      await expect(
        paymentService.createCheckoutSession(ownerId, paidAppt._id.toString())
      ).rejects.toThrow(/already been paid/i);
    });

    it('should reject payment confirmation when transaction does not exist', async () => {
      const fakeTxId = new mongoose.Types.ObjectId().toString();
      await expect(paymentService.confirmPayment(ownerId, fakeTxId)).rejects.toThrow(/not found/i);
    });

    it('should reject payment confirmation if attempted by another user', async () => {
      const appt = await AppointmentModel.create({
        petId: new mongoose.Types.ObjectId(testPetId),
        ownerId: new mongoose.Types.ObjectId(ownerId),
        clinicId: new mongoose.Types.ObjectId(testClinicId),
        appointmentDate: '2026-11-06',
        startTime: '17:00',
        type: 'dental',
        status: 'scheduled',
        scheduledAt: new Date(),
        duration: 30,
        fee: 90,
        paymentStatus: 'pending',
      });

      const session = await paymentService.createCheckoutSession(ownerId, appt._id.toString());

      await expect(
        paymentService.confirmPayment(otherUserId, session.transactionId)
      ).rejects.toThrow(/access denied/i);
    });

    it('should record failed status when webhook delivers failure payload', async () => {
      const appt = await AppointmentModel.create({
        petId: new mongoose.Types.ObjectId(testPetId),
        ownerId: new mongoose.Types.ObjectId(ownerId),
        clinicId: new mongoose.Types.ObjectId(testClinicId),
        appointmentDate: '2026-11-07',
        startTime: '09:00',
        type: 'checkup',
        status: 'scheduled',
        scheduledAt: new Date(),
        duration: 30,
        fee: 40,
        paymentStatus: 'pending',
      });

      const session = await paymentService.createCheckoutSession(ownerId, appt._id.toString());

      const webhookPayload = {
        type: 'checkout.session.failed',
        transactionId: session.transactionId,
        status: 'failed' as const,
      };

      const result = await paymentService.processWebhook(webhookPayload);
      expect(result.processed).toBe(true);

      const tx = await PaymentTransactionModel.findById(session.transactionId);
      expect(tx?.status).toBe('failed');
    });
  });
});
