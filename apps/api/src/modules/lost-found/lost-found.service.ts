import { LostFoundReportModel, type ILostFoundReportDocument } from './lost-found.model';
import { petService } from '../pets/pet.service';
import { notificationService } from '../notifications/services/notification.service';
import { eventBus } from '../events/services/event-bus.service';
import { DomainEventType } from '@petverse/shared-types';
import { NotFoundError, ForbiddenError, AppError } from '../../shared/errors/AppError';
import mongoose from 'mongoose';

export interface CreateReportInput {
  type: 'lost' | 'found';
  petId?: string;
  petName?: string;
  species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
  breed?: string;
  color?: string;
  gender?: 'male' | 'female' | 'unknown';
  contactMethod?: 'in_app' | 'phone' | 'email';
  contactPhone?: string;
  contactEmail?: string;
  location: {
    coordinates: [number, number]; // [lng, lat]
    address: string;
    city?: string;
  };
  eventDate: string;
  description: string;
  photos?: string[];
}

export const lostFoundService = {
  async createReport(
    userId: string,
    userName: string,
    data: CreateReportInput
  ): Promise<ILostFoundReportDocument> {
    // 1. If linking to an existing pet, verify ownership
    if (data.petId) {
      const pet = await petService.getPetById(data.petId, userId);
      data.petName = pet.name;
      data.species = pet.species as any;
      data.breed = pet.breed;
      data.color = pet.color;
      data.gender = pet.gender as any;
      if (!data.photos || data.photos.length === 0) {
        data.photos = pet.avatar ? [pet.avatar] : pet.gallery || [];
      }

      // Automatically mark pet as lost
      if (data.type === 'lost') {
        await petService.updatePet(data.petId, userId, { isLost: true } as any);
      }
    }

    const report = await LostFoundReportModel.create({
      type: data.type,
      petId: data.petId ? new mongoose.Types.ObjectId(data.petId) : undefined,
      petName: data.petName,
      species: data.species,
      breed: data.breed,
      color: data.color,
      gender: data.gender || 'unknown',
      reporterId: new mongoose.Types.ObjectId(userId),
      reporterName: userName,
      contactMethod: data.contactMethod || 'in_app',
      contactPhone: data.contactPhone,
      contactEmail: data.contactEmail,
      location: {
        type: 'Point',
        coordinates: data.location.coordinates,
        address: data.location.address,
        city: data.location.city,
      },
      eventDate: data.eventDate,
      description: data.description,
      photos: data.photos || [],
      status: 'active',
      moderationStatus: 'approved',
    });

    // 2. Publish Domain Event
    eventBus.publish(
      report._id.toString(),
      'LostFoundReport',
      data.type === 'lost' ? DomainEventType.LostPetReported : DomainEventType.PetFound,
      {
        reportId: report._id.toString(),
        type: data.type,
        species: data.species,
        location: data.location.address,
      },
      {},
      userId
    );

    return report;
  },

  async getReports(query: {
    type?: 'lost' | 'found';
    species?: string;
    breed?: string;
    city?: string;
    status?: string;
    search?: string;
    lng?: number;
    lat?: number;
    maxDistanceKm?: number;
    page?: number;
    limit?: number;
  }): Promise<{ data: ILostFoundReportDocument[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(50, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const filter: any = {
      status: query.status || 'active',
      moderationStatus: 'approved',
    };

    if (query.type) filter.type = query.type;
    if (query.species) filter.species = query.species;
    if (query.breed) filter.breed = { $regex: query.breed, $options: 'i' };
    if (query.city) filter.city = { $regex: query.city, $options: 'i' };

    if (query.search) {
      filter.$or = [
        { petName: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
        { 'location.address': { $regex: query.search, $options: 'i' } },
        { breed: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query.lng !== undefined && query.lat !== undefined) {
      const maxDistance = (query.maxDistanceKm || 50) * 1000; // in meters
      filter.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [query.lng, query.lat] },
          $maxDistance: maxDistance,
        },
      };
    }

    const [data, total] = await Promise.all([
      LostFoundReportModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      LostFoundReportModel.countDocuments(filter).exec(),
    ]);

    return { data, total, page, limit };
  },

  async getReportById(
    id: string,
    requestingUserId?: string,
    isAdmin = false
  ): Promise<ILostFoundReportDocument> {
    const report = await LostFoundReportModel.findById(id).select('+contactPhone +contactEmail').exec();
    if (!report) throw new NotFoundError('Lost/Found Report');

    // Only expose phone & email to owner or admin
    const isOwner = requestingUserId && report.reporterId.toString() === requestingUserId;
    if (!isOwner && !isAdmin) {
      report.contactPhone = undefined;
      report.contactEmail = undefined;
    }

    return report;
  },

  async findMatches(reportId: string): Promise<Array<{ report: ILostFoundReportDocument; score: number }>> {
    const target = await LostFoundReportModel.findById(reportId).exec();
    if (!target) throw new NotFoundError('Lost/Found Report');

    const oppositeType = target.type === 'lost' ? 'found' : 'lost';

    // Candidate reports with opposite type and matching species
    const candidates = await LostFoundReportModel.find({
      _id: { $ne: target._id },
      type: oppositeType,
      species: target.species,
      status: 'active',
      moderationStatus: 'approved',
    }).limit(20).exec();

    const scoredMatches = candidates.map((cand) => {
      let score = 40; // Base score for species match

      // Breed similarity (30 pts)
      if (target.breed && cand.breed) {
        if (target.breed.toLowerCase() === cand.breed.toLowerCase()) {
          score += 30;
        } else if (
          target.breed.toLowerCase().includes(cand.breed.toLowerCase()) ||
          cand.breed.toLowerCase().includes(target.breed.toLowerCase())
        ) {
          score += 15;
        }
      }

      // Proximity distance (up to 30 pts)
      const [lng1, lat1] = target.location.coordinates;
      const [lng2, lat2] = cand.location.coordinates;
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLng = (lng2 - lng1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
          Math.cos(lat2 * (Math.PI / 180)) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distKm = 6371 * c; // Earth's radius in km

      if (distKm <= 5) score += 30;
      else if (distKm <= 15) score += 20;
      else if (distKm <= 35) score += 10;

      return { report: cand, score };
    });

    return scoredMatches.sort((a, b) => b.score - a.score);
  },

  async sendInquiry(
    reportId: string,
    senderId: string,
    senderName: string,
    message: string,
    contactInfo?: string
  ): Promise<ILostFoundReportDocument> {
    const report = await LostFoundReportModel.findById(reportId).exec();
    if (!report) throw new NotFoundError('Lost/Found Report');

    report.inquiries.push({
      senderId: new mongoose.Types.ObjectId(senderId),
      senderName,
      message,
      contactInfo,
      createdAt: new Date(),
    });
    await report.save();

    // Send in-app notification to report owner
    await notificationService.dispatch(
      report.reporterId.toString(),
      'New Lost & Found Inquiry',
      `${senderName} sent a message regarding your ${report.type} report "${report.petName || report.species}".`,
      'health_alert',
      'high',
      ['in-app'],
      { reportId, type: report.type }
    );

    return report;
  },

  async resolveReport(reportId: string, userId: string, isAdmin = false): Promise<ILostFoundReportDocument> {
    const report = await LostFoundReportModel.findById(reportId).exec();
    if (!report) throw new NotFoundError('Lost/Found Report');
    if (!isAdmin && report.reporterId.toString() !== userId) {
      throw new ForbiddenError('You can only resolve your own reports');
    }

    report.status = 'resolved';
    await report.save();

    if (report.petId) {
      await petService.updatePet(report.petId.toString(), userId, { isLost: false } as any);
    }

    return report;
  },

  async moderateReport(
    reportId: string,
    moderationStatus: 'approved' | 'flagged' | 'rejected'
  ): Promise<ILostFoundReportDocument> {
    const report = await LostFoundReportModel.findById(reportId).exec();
    if (!report) throw new NotFoundError('Lost/Found Report');
    report.moderationStatus = moderationStatus;
    await report.save();
    return report;
  },
};
