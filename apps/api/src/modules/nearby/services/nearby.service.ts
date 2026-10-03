import { ClinicModel, type IClinicDocument } from '../../appointments/models/clinic.model';
import { ReviewModel } from '../models/review.model';
import { UserModel } from '../../users/user.model';
import { NotFoundError, AppError } from '../../../shared/errors/AppError';
import type { IClinic } from '@petverse/shared-types';
import mongoose from 'mongoose';
import { env } from '../../../config/env';

export const nearbyService = {
  /** Seed initial verified clinics if database has 0 clinics (development/test only — NEVER in production) */
  async seedClinicsIfEmpty(): Promise<void> {
    if (env.NODE_ENV === 'production' || process.env.NODE_ENV === 'production') {
      return;
    }
    const count = await ClinicModel.countDocuments();
    if (count > 0) return;

    const dummyOwnerId = new mongoose.Types.ObjectId();

    await ClinicModel.create([
      {
        name: 'Cessna Lifeline Veterinary Hospital',
        ownerId: dummyOwnerId,
        type: 'veterinary_clinic',
        address: 'No. 12, Intermediate Ring Rd, Domlur, Bengaluru, KA 560071',
        location: { type: 'Point', coordinates: [77.6376, 12.9600] },
        phone: '+91 80 2535 1234',
        email: 'info@cessnalifeline.com',
        services: ['Routine Checkup', 'Vaccinations', 'Dental Care', 'Surgery', 'Radiology'],
        ratings: { avg: 4.8, count: 312 },
        isVerified: true,
        emergencyAvailable: true,
      },
      {
        name: 'PAWS Animal Hospital & Emergency',
        ownerId: dummyOwnerId,
        type: 'emergency_hospital',
        address: 'Juhu Tara Rd, Juhu, Mumbai, MH 400049',
        location: { type: 'Point', coordinates: [72.8264, 19.1021] },
        phone: '+91 22 2611 3939',
        email: 'emergency@pawsmumbai.org',
        services: ['24/7 Emergency ICU', 'Trauma Surgery', 'Blood Transfusion', 'Oxygen Therapy', 'Intensive Care'],
        ratings: { avg: 4.9, count: 528 },
        isVerified: true,
        emergencyAvailable: true,
      },
      {
        name: 'Critter Care Veterinary & Grooming Spa',
        ownerId: dummyOwnerId,
        type: 'groomer',
        address: 'Plot 15, Aundh, Pune, MH 411007',
        location: { type: 'Point', coordinates: [73.8208, 18.5591] },
        phone: '+91 20 2588 7744',
        email: 'care@crittercarepune.com',
        services: ['Full Bath & Haircut', 'Nail Trimming', 'De-Shedding Treatment', 'Ear Cleaning', 'Dental Scaling'],
        ratings: { avg: 4.7, count: 183 },
        isVerified: true,
        emergencyAvailable: false,
      },
      {
        name: 'Blue Cross Veterinary Centre',
        ownerId: dummyOwnerId,
        type: 'veterinary_clinic',
        address: '11, Eldams Rd, Alwarpet, Chennai, TN 600018',
        location: { type: 'Point', coordinates: [80.2490, 13.0330] },
        phone: '+91 44 2435 1000',
        email: 'clinic@bluecrossofindia.org',
        services: ['General Practice', 'Microchipping', 'Ultrasound', 'Vaccinations', 'Physiotherapy'],
        ratings: { avg: 4.6, count: 241 },
        isVerified: true,
        emergencyAvailable: false,
      },
      {
        name: 'Hyderabad Animal Hospital & Research Centre',
        ownerId: dummyOwnerId,
        type: 'veterinary_clinic',
        address: '5-4-59, Abids, Hyderabad, TS 500001',
        location: { type: 'Point', coordinates: [78.4672, 17.3800] },
        phone: '+91 40 2461 5500',
        email: 'contact@hahrc.in',
        services: ['General Practice', 'Oncology', 'Orthopedics', 'Lab Diagnostics', 'Endoscopy'],
        ratings: { avg: 4.7, count: 196 },
        isVerified: true,
        emergencyAvailable: true,
      },
    ]);
  },

  async getNearbyServices(query: {
    lat?: number;
    lng?: number;
    radiusKm?: number;
    type?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: (IClinic & { distanceKm?: number })[]; total: number }> {
    await this.seedClinicsIfEmpty();

    const hasCoordinates = typeof query.lat === 'number' && typeof query.lng === 'number';
    let formatted: (IClinic & { distanceKm?: number })[] = [];

    if (hasCoordinates) {
      const maxDistanceMeters = (query.radiusKm || 25) * 1000;
      const pipeline: any[] = [
        {
          $geoNear: {
            near: { type: 'Point', coordinates: [query.lng, query.lat] },
            distanceField: 'dist.calculated',
            maxDistance: maxDistanceMeters,
            spherical: true,
          },
        },
      ];

      if (query.type) {
        pipeline.push({ $match: { type: query.type } });
      }

      if (query.search) {
        pipeline.push({
          $match: {
            $or: [
              { name: new RegExp(query.search, 'i') },
              { address: new RegExp(query.search, 'i') },
              { services: new RegExp(query.search, 'i') },
            ],
          },
        });
      }

      const results = await ClinicModel.aggregate(pipeline).exec();

      formatted = results.map((item) => {
        const distanceKm = item.dist?.calculated
          ? Math.round((item.dist.calculated / 1000) * 10) / 10
          : 0;

        const clinicObj = {
          ...item,
          _id: item._id.toString(),
          ownerId: item.ownerId.toString(),
          distanceKm,
        };
        delete clinicObj.dist;
        delete clinicObj.__v;
        return clinicObj;
      });
    } else {
      // General non-geographical query: search all clinics by criteria without forcing fake SF coordinates
      const filter: any = {};
      if (query.type) filter.type = query.type;
      if (query.search) {
        filter.$or = [
          { name: new RegExp(query.search, 'i') },
          { address: new RegExp(query.search, 'i') },
          { services: new RegExp(query.search, 'i') },
        ];
      }

      const docs = await ClinicModel.find(filter)
        .sort({ 'ratings.avg': -1, createdAt: -1 })
        .limit(query.limit || 50)
        .lean()
        .exec();

      formatted = docs.map((doc: any) => ({
        ...doc,
        _id: doc._id.toString(),
        ownerId: doc.ownerId.toString(),
      }));
    }

    return {
      data: formatted,
      total: formatted.length,
    };
  },

  async getClinicById(id: string): Promise<IClinic> {
    if (!mongoose.Types.ObjectId.isValid(id)) throw new NotFoundError('Clinic');
    const clinic = await ClinicModel.findById(id).exec();
    if (!clinic) throw new NotFoundError('Clinic');
    return clinic.toJSON() as unknown as IClinic;
  },

  async getClinicReviews(clinicId: string) {
    if (!mongoose.Types.ObjectId.isValid(clinicId)) throw new NotFoundError('Clinic');
    return ReviewModel.find({ targetId: clinicId }).sort({ createdAt: -1 }).exec();
  },

  async addReview(
    clinicId: string,
    userId: string,
    data: { rating: number; comment: string }
  ) {
    if (!mongoose.Types.ObjectId.isValid(clinicId)) throw new NotFoundError('Clinic');
    const clinic = await ClinicModel.findById(clinicId).exec();
    if (!clinic) throw new NotFoundError('Clinic');

    const user = await UserModel.findById(userId).exec();
    const userName = user?.profile ? `${user.profile.firstName} ${user.profile.lastName}` : 'Pet Owner';
    const userAvatar = user?.profile?.avatar;

    const review = await ReviewModel.create({
      targetId: clinicId as any,
      userId: userId as any,
      userName,
      userAvatar,
      rating: data.rating,
      comment: data.comment,
    });

    // Recalculate rating average for Clinic
    const allReviews = await ReviewModel.find({ targetId: clinicId }).exec();
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const count = allReviews.length;
    const avg = Number((totalRating / count).toFixed(1));

    clinic.ratings = { avg, count };
    await clinic.save();

    return review;
  },
};
