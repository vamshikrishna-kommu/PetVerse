import { AdoptionListingModel, AdoptionApplicationModel } from './adoption.model';
import { userRepository } from '../users/user.repository';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../shared/errors/AppError';
import type { IAdoptionListing, IAdoptionApplication, AdoptionStatus, PetSpecies } from '@petverse/shared-types';

export interface AdoptionQueryDTO {
  species?: string;
  gender?: string;
  size?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CreateAdoptionListingDTO {
  name: string;
  species: PetSpecies;
  breed?: string;
  age: string;
  gender: 'male' | 'female' | 'unknown';
  size: 'small' | 'medium' | 'large' | 'giant';
  description: string;
  photos?: string[];
  isVaccinated?: boolean;
  isSpayedNeutered?: boolean;
  specialNeeds?: string;
  location: string;
  shelterName?: string;
  shelterContact?: string;
}

export interface SubmitApplicationDTO {
  applicantName: string;
  applicantEmail: string;
  applicantPhone: string;
  homeType: 'apartment' | 'house_with_yard' | 'house_no_yard';
  hasOtherPets: boolean;
  otherPetsDetails?: string;
  experienceDescription: string;
}

export class AdoptionService {
  async getListings(query: AdoptionQueryDTO = {}): Promise<{ listings: IAdoptionListing[]; total: number; page: number; totalPages: number }> {
    await this.seedInitialListingsIfEmpty();

    const filter: any = {};

    if (query.species && query.species !== 'all') {
      filter.species = query.species;
    }

    if (query.gender && query.gender !== 'all') {
      filter.gender = query.gender;
    }

    if (query.size && query.size !== 'all') {
      filter.size = query.size;
    }

    if (query.status && query.status !== 'all') {
      filter.status = query.status;
    } else {
      filter.status = { $in: ['available', 'pending'] };
    }

    if (query.search && query.search.trim()) {
      const q = query.search.trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { breed: { $regex: q, $options: 'i' } },
        { location: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(50, Number(query.limit) || 15));
    const skip = (page - 1) * limit;

    const [listings, total] = await Promise.all([
      AdoptionListingModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      AdoptionListingModel.countDocuments(filter),
    ]);

    const formatted = listings.map((item: any) => ({
      ...item,
      _id: item._id.toString(),
    })) as IAdoptionListing[];

    return {
      listings: formatted,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getListingById(id: string): Promise<IAdoptionListing> {
    const listing = await AdoptionListingModel.findById(id).lean();
    if (!listing) throw new NotFoundError('Adoption listing not found');
    return {
      ...listing,
      _id: listing._id.toString(),
    } as IAdoptionListing;
  }

  async createListing(userId: string, data: CreateAdoptionListingDTO): Promise<IAdoptionListing> {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const shelterName =
      data.shelterName ||
      `${user.profile.firstName} ${user.profile.lastName} (Shelter / Foster Caretaker)`;
    const shelterContact = data.shelterContact || user.phone || user.email;

    const listing = await AdoptionListingModel.create({
      shelterId: userId,
      shelterName,
      shelterContact,
      name: data.name,
      species: data.species,
      breed: data.breed,
      age: data.age,
      gender: data.gender,
      size: data.size,
      description: data.description,
      photos: data.photos || [],
      isVaccinated: data.isVaccinated ?? true,
      isSpayedNeutered: data.isSpayedNeutered ?? true,
      specialNeeds: data.specialNeeds,
      location: data.location,
      status: 'available',
    });

    return listing.toJSON() as unknown as IAdoptionListing;
  }

  async updateListing(
    userId: string,
    id: string,
    data: Partial<CreateAdoptionListingDTO & { status: AdoptionStatus }>,
    isAdmin = false
  ): Promise<IAdoptionListing> {
    const listing = await AdoptionListingModel.findById(id);
    if (!listing) throw new NotFoundError('Adoption listing not found');

    if (listing.shelterId !== userId && !isAdmin) {
      throw new ForbiddenError('You can only modify adoption listings you posted');
    }

    Object.assign(listing, data);
    await listing.save();
    return listing.toJSON() as unknown as IAdoptionListing;
  }

  async deleteListing(userId: string, id: string, isAdmin = false): Promise<void> {
    const listing = await AdoptionListingModel.findById(id);
    if (!listing) throw new NotFoundError('Adoption listing not found');

    if (listing.shelterId !== userId && !isAdmin) {
      throw new ForbiddenError('You can only delete adoption listings you posted');
    }

    await listing.deleteOne();
  }

  async submitApplication(
    userId: string,
    listingId: string,
    data: SubmitApplicationDTO
  ): Promise<IAdoptionApplication> {
    const listing = await AdoptionListingModel.findById(listingId);
    if (!listing) throw new NotFoundError('Adoption listing not found');

    if (listing.status !== 'available') {
      throw new BadRequestError('This pet is no longer open for new adoption applications');
    }

    const existing = await AdoptionApplicationModel.findOne({
      listingId,
      applicantId: userId,
    });
    if (existing) {
      throw new BadRequestError('You have already submitted an adoption application for this pet');
    }

    const application = await AdoptionApplicationModel.create({
      listingId,
      applicantId: userId,
      applicantName: data.applicantName,
      applicantEmail: data.applicantEmail,
      applicantPhone: data.applicantPhone,
      homeType: data.homeType,
      hasOtherPets: data.hasOtherPets,
      otherPetsDetails: data.otherPetsDetails,
      experienceDescription: data.experienceDescription,
      status: 'submitted',
    });

    return application.toJSON() as unknown as IAdoptionApplication;
  }

  async getMyApplications(userId: string): Promise<Array<IAdoptionApplication & { listing?: IAdoptionListing }>> {
    const apps = await AdoptionApplicationModel.find({ applicantId: userId }).sort({ createdAt: -1 }).lean();
    const listingIds = apps.map((a) => a.listingId);
    const listings = await AdoptionListingModel.find({ _id: { $in: listingIds } }).lean();
    const listingMap = new Map(listings.map((l: any) => [l._id.toString(), { ...l, _id: l._id.toString() }]));

    return apps.map((a: any) => ({
      ...a,
      _id: a._id.toString(),
      listing: listingMap.get(a.listingId),
    }));
  }

  async getListingApplications(userId: string, listingId: string, isAdmin = false): Promise<IAdoptionApplication[]> {
    const listing = await AdoptionListingModel.findById(listingId);
    if (!listing) throw new NotFoundError('Listing not found');

    if (listing.shelterId !== userId && !isAdmin) {
      throw new ForbiddenError('Unauthorized to inspect applications for this listing');
    }

    const apps = await AdoptionApplicationModel.find({ listingId }).sort({ createdAt: -1 }).lean();
    return apps.map((a: any) => ({
      ...a,
      _id: a._id.toString(),
    })) as IAdoptionApplication[];
  }

  async updateApplicationStatus(
    userId: string,
    applicationId: string,
    status: 'under_review' | 'approved' | 'rejected',
    reviewNotes?: string,
    isAdmin = false
  ): Promise<IAdoptionApplication> {
    const app = await AdoptionApplicationModel.findById(applicationId);
    if (!app) throw new NotFoundError('Application not found');

    const listing = await AdoptionListingModel.findById(app.listingId);
    if (!listing) throw new NotFoundError('Listing not found');

    if (listing.shelterId !== userId && !isAdmin) {
      throw new ForbiddenError('Unauthorized to review this application');
    }

    app.status = status;
    app.reviewedAt = new Date().toISOString();
    if (reviewNotes !== undefined) app.reviewNotes = reviewNotes;

    await app.save();

    if (status === 'approved') {
      listing.status = 'pending';
      await listing.save();
    }

    return app.toJSON() as unknown as IAdoptionApplication;
  }

  private async seedInitialListingsIfEmpty(): Promise<void> {
    const count = await AdoptionListingModel.countDocuments();
    if (count > 0) return;

    const initialRescues = [
      {
        shelterId: 'system_shelter_1',
        shelterName: 'PetVerse Compassion Animal Sanctuary',
        shelterContact: 'adoptions@petverseshelter.org',
        name: 'Milo',
        species: 'dog',
        breed: 'Golden Retriever & Lab Mix',
        age: '2 years',
        gender: 'male',
        size: 'large',
        description: 'Milo is a friendly, house-trained gentle soul who loves fetch, belly rubs, and playing with other dogs. Fully vaccinated, microchipped, and heartworm negative.',
        photos: ['https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&auto=format&fit=crop&q=80'],
        isVaccinated: true,
        isSpayedNeutered: true,
        specialNeeds: 'Requires daily walks and loves squeaky toys.',
        location: 'Bengaluru, KA',
        status: 'available',
      },
      {
        shelterId: 'system_shelter_1',
        shelterName: 'PetVerse Compassion Animal Sanctuary',
        shelterContact: 'adoptions@petverseshelter.org',
        name: 'Luna',
        species: 'cat',
        breed: 'Calico Shorthair',
        age: '1 year',
        gender: 'female',
        size: 'small',
        description: 'Luna is a curious purr machine who adores feather wands and sunny window perches. Litter box trained and very affectionate.',
        photos: ['https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80'],
        isVaccinated: true,
        isSpayedNeutered: true,
        location: 'Mumbai, MH',
        status: 'available',
      },
      {
        shelterId: 'system_shelter_1',
        shelterName: 'Hope Feline Foster Network',
        shelterContact: 'foster@hopepetnetwork.org',
        name: 'Barnaby',
        species: 'rabbit',
        breed: 'Holland Lop',
        age: '8 months',
        gender: 'male',
        size: 'small',
        description: 'Gentle, litter-trained indoor rabbit. Enjoys fresh Timothy hay, romaine lettuce, and gentle head strokes.',
        photos: ['https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=600&auto=format&fit=crop&q=80'],
        isVaccinated: true,
        isSpayedNeutered: true,
        location: 'Hyderabad, TS',
        status: 'available',
      },
    ];

    await AdoptionListingModel.insertMany(initialRescues);
  }
}

export const adoptionService = new AdoptionService();
