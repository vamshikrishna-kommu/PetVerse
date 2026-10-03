import mongoose from 'mongoose';
import { adoptionService } from '../adoption.service';
import { AdoptionListingModel, AdoptionApplicationModel } from '../adoption.model';
import { UserModel } from '../../users/user.model';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../../shared/errors/AppError';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/petverse_test';

describe('Adoption Service — Unit & Integration Tests', () => {
  let shelterUserId: string;
  let applicantId: string;
  let strangerId: string;
  let listingId: string;
  let createdApplicationId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }

    const shelterUser = await UserModel.create({
      email: `shelter_manager_${Date.now()}@testverse.com`,
      profile: { firstName: 'Bay Area', lastName: 'Rescue' },
      passwordHash: 'dummyhash123',
      role: 'shelter',
      isVerified: true,
      isActive: true,
    });
    shelterUserId = shelterUser._id.toString();

    const applicant = await UserModel.create({
      email: `adopter_${Date.now()}@testverse.com`,
      profile: { firstName: 'David', lastName: 'Miller' },
      passwordHash: 'dummyhash123',
      role: 'pet_owner',
      isVerified: true,
      isActive: true,
    });
    applicantId = applicant._id.toString();

    const stranger = await UserModel.create({
      email: `stranger_adopter_${Date.now()}@testverse.com`,
      profile: { firstName: 'Eva', lastName: 'Green' },
      passwordHash: 'dummyhash123',
      role: 'pet_owner',
      isVerified: true,
      isActive: true,
    });
    strangerId = stranger._id.toString();
  });

  afterAll(async () => {
    await UserModel.deleteMany({ _id: { $in: [shelterUserId, applicantId, strangerId] } });
    await AdoptionListingModel.deleteMany({ shelterId: shelterUserId });
    await AdoptionApplicationModel.deleteMany({ applicantId });
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  it('should create an adoption listing by shelter staff', async () => {
    const listing = await adoptionService.createListing(shelterUserId, {
      name: 'Biscuit',
      species: 'dog',
      breed: 'Golden Retriever Mix',
      age: '2 years',
      gender: 'male',
      size: 'large',
      description: 'Gentle, house-trained, great with kids and other pets.',
      location: 'Bengaluru, KA',
      shelterName: 'CUPA Compassion Unlimited Plus Action',
      isVaccinated: true,
      isSpayedNeutered: true,
    });

    expect(listing._id).toBeDefined();
    expect(listing.name).toBe('Biscuit');
    expect(listing.status).toBe('available');
    expect(listing.isVaccinated).toBe(true);

    listingId = listing._id.toString();
  });

  it('should list adoption listings and filter by species and gender', async () => {
    const result = await adoptionService.getListings({
      species: 'dog',
      gender: 'male',
    });

    expect(result.listings.length).toBeGreaterThan(0);
    expect(result.listings.some((l) => l._id.toString() === listingId)).toBe(true);
  });

  it('should get adoption listing by ID', async () => {
    const listing = await adoptionService.getListingById(listingId);
    expect(listing._id.toString()).toBe(listingId);
    expect(listing.name).toBe('Biscuit');
  });

  it('should submit an adoption application for an available pet', async () => {
    const application = await adoptionService.submitApplication(applicantId, listingId, {
      applicantName: 'David Miller',
      applicantEmail: 'adopter@testverse.com',
      applicantPhone: '+1 555 777 8888',
      homeType: 'house_with_yard',
      hasOtherPets: true,
      otherPetsDetails: 'One friendly senior cat',
      experienceDescription: 'Experienced dog owner for over 15 years.',
    });

    expect(application._id).toBeDefined();
    expect(application.status).toBe('submitted');
    expect(application.applicantName).toBe('David Miller');

    createdApplicationId = application._id.toString();
  });

  it('should prevent duplicate active applications from the same user for the same pet', async () => {
    await expect(
      adoptionService.submitApplication(applicantId, listingId, {
        applicantName: 'David Miller',
        applicantEmail: 'adopter@testverse.com',
        applicantPhone: '+1 555 777 8888',
        homeType: 'house_with_yard',
        hasOtherPets: true,
        experienceDescription: 'Duplicate attempt',
      })
    ).rejects.toThrow(BadRequestError);
  });

  it('should list applications for applicant', async () => {
    const apps = await adoptionService.getMyApplications(applicantId);
    expect(apps.length).toBe(1);
    expect(apps[0]._id.toString()).toBe(createdApplicationId);
    expect(apps[0].listing?._id.toString()).toBe(listingId);
  });

  it('should allow shelter staff to review and approve adoption application', async () => {
    const reviewed = await adoptionService.updateApplicationStatus(
      shelterUserId,
      createdApplicationId,
      'approved',
      'Excellent home environment and background check cleared.'
    );

    expect(reviewed.status).toBe('approved');
    expect(reviewed.reviewNotes).toContain('Excellent home environment');

    // Listing status transitions to pending
    const listing = await adoptionService.getListingById(listingId);
    expect(listing.status).toBe('pending');
  });
});
