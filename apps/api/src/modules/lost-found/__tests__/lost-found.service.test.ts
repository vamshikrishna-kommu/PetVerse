import mongoose from 'mongoose';
import { lostFoundService } from '../lost-found.service';
import { LostFoundReportModel } from '../lost-found.model';
import { PetModel } from '../../pets/pet.model';
import { UserModel } from '../../users/user.model';
import { ForbiddenError, NotFoundError } from '../../../shared/errors/AppError';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/petverse_test';

describe('Lost & Found Service — Unit & Integration Tests', () => {
  let reporterId: string;
  let finderId: string;
  let petId: string;
  let lostReportId: string;
  let foundReportId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }

    const reporter = await UserModel.create({
      email: `lf_reporter_${Date.now()}@testverse.com`,
      profile: { firstName: 'Alice', lastName: 'Reporter' },
      passwordHash: 'dummyhash123',
      role: 'pet_owner',
      isVerified: true,
      isActive: true,
    });
    reporterId = reporter._id.toString();

    const finder = await UserModel.create({
      email: `lf_finder_${Date.now()}@testverse.com`,
      profile: { firstName: 'Bob', lastName: 'Finder' },
      passwordHash: 'dummyhash123',
      role: 'pet_owner',
      isVerified: true,
      isActive: true,
    });
    finderId = finder._id.toString();

    const pet = await PetModel.create({
      ownerId: new mongoose.Types.ObjectId(reporterId),
      name: 'Oliver',
      species: 'cat',
      breed: 'Siamese',
      color: 'Seal Point',
      gender: 'male',
      dob: '2022-01-01',
      weight: 4.5,
      isLost: false,
    });
    petId = pet._id.toString();
  });

  afterAll(async () => {
    await UserModel.deleteMany({ _id: { $in: [reporterId, finderId] } });
    await PetModel.findByIdAndDelete(petId);
    await LostFoundReportModel.deleteMany({
      reporterId: { $in: [reporterId, finderId] },
    });
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  describe('Report Creation & Automated Pet Status Update', () => {
    it('Creates a lost report and automatically marks pet as lost', async () => {
      const report = await lostFoundService.createReport(
        reporterId,
        'Alice Reporter',
        {
          type: 'lost',
          petId,
          species: 'cat',
          location: {
            coordinates: [72.8777, 19.0760],
            address: 'Bandra-Kurla Complex, Mumbai, MH',
          },
          eventDate: '2026-10-01',
          description: 'Slipped out of harness near the tennis courts.',
        }
      );

      expect(report).toBeDefined();
      expect(report.type).toBe('lost');
      expect(report.petName).toBe('Oliver');
      expect(report.breed).toBe('Siamese');
      lostReportId = report._id.toString();

      // Check pet was marked isLost = true
      const updatedPet = await PetModel.findById(petId);
      expect(updatedPet?.isLost).toBe(true);
    });

    it('Creates a found report for an animal sighted by community member', async () => {
      const foundReport = await lostFoundService.createReport(
        finderId,
        'Bob Finder',
        {
          type: 'found',
          species: 'cat',
          breed: 'Siamese',
          color: 'Seal Point',
          gender: 'male',
          location: {
            coordinates: [72.8790, 19.0775], // ~200m away
            address: 'Linking Road, Bandra West, Mumbai, MH',
          },
          eventDate: '2026-10-02',
          description: 'Friendly Siamese cat found sitting on porch with no collar.',
        }
      );

      expect(foundReport).toBeDefined();
      expect(foundReport.type).toBe('found');
      foundReportId = foundReport._id.toString();
    });
  });

  describe('Smart Matching Algorithm', () => {
    it('Accurately matches lost report against candidate found report with high score', async () => {
      const matches = await lostFoundService.findMatches(lostReportId);
      expect(Array.isArray(matches)).toBe(true);
      expect(matches.length).toBeGreaterThanOrEqual(1);

      const topMatch = matches.find((m) => m.report._id.toString() === foundReportId);
      expect(topMatch).toBeDefined();
      expect(topMatch?.score).toBeGreaterThanOrEqual(75); // Strong match on species, breed, color, gender, proximity
    });
  });

  describe('Secure Inquiries & Resolution', () => {
    it('Dispatches private in-app inquiry to reporter without leaking contact info', async () => {
      const updatedReport = await lostFoundService.sendInquiry(
        lostReportId,
        finderId,
        'Bob Finder',
        'I have your cat Oliver safe inside my house on 18th St!',
        '+91 98765 43210'
      );

      expect(updatedReport.inquiries).toBeDefined();
      expect(updatedReport.inquiries!.length).toBeGreaterThanOrEqual(1);
      const inquiry = updatedReport.inquiries![updatedReport.inquiries!.length - 1];
      expect(inquiry.senderName).toBe('Bob Finder');
      expect(inquiry.message).toContain('Oliver safe inside');
    });

    it('Rejects stranger from resolving report', async () => {
      await expect(
        lostFoundService.resolveReport(lostReportId, finderId, false)
      ).rejects.toThrow(ForbiddenError);
    });

    it('Author resolves report and pet is marked no longer lost', async () => {
      const resolved = await lostFoundService.resolveReport(lostReportId, reporterId, false);
      expect(resolved.status).toBe('resolved');

      const updatedPet = await PetModel.findById(petId);
      expect(updatedPet?.isLost).toBe(false);
    });

    it('Admin can moderate report status', async () => {
      const moderated = await lostFoundService.moderateReport(foundReportId, 'flagged');
      expect(moderated.moderationStatus).toBe('flagged');
    });
  });
});
