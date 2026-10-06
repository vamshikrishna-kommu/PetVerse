import mongoose from 'mongoose';
import { ClinicModel, type IClinicDocument } from '../../appointments/models/clinic.model';
import { ReviewModel } from '../models/review.model';
import { UserModel } from '../../users/user.model';
import { NotFoundError } from '../../../shared/errors/AppError';
import type { IClinic } from '@petverse/shared-types';
import { env } from '../../../config/env';
import { logger } from '../../../shared/utils/logger';
import {
  googlePlacesService,
  calculateDistanceKm,
  matchLocalityFromAddress,
  type GooglePlacesSearchOptions,
} from './google-places.service';
import { osmPlacesService, VERIFIED_HYDERABAD_CLINICS } from './osm-places.service';

export const nearbyService = {
  /**
   * Safe seed for testing environments only.
   * Completely disabled in production and development to prevent fake clinic creation.
   */
  async seedClinicsIfEmpty(): Promise<void> {
    if (env.NODE_ENV === 'production' || process.env.NODE_ENV === 'production') {
      return;
    }

    // Only allow minimal test fixture in test runner environment
    if (process.env.NODE_ENV !== 'test') {
      return;
    }

    const cessnaExists = await ClinicModel.findOne({ name: 'Cessna Lifeline Veterinary Hospital' });
    if (!cessnaExists) {
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
    }
  },

  /**
   * Discover nearby clinics in Hyderabad and surrounding areas.
   * Combines official Google Places live directory discovery with PetVerse registered partner clinics.
   */
  async getNearbyServices(query: {
    lat?: number;
    lng?: number;
    radiusKm?: number;
    type?: string;
    search?: string;
    locality?: string;
    emergencyOnly?: boolean;
    openNow?: boolean;
    minRating?: number;
    page?: number;
    limit?: number;
  }): Promise<{
    data: (IClinic & { distanceKm?: number })[];
    total: number;
    source: 'google_places' | 'openstreetmap' | 'petverse' | 'combined' | 'unconfigured';
  }> {
    await this.seedClinicsIfEmpty();

    const clinicsMap = new Map<string, IClinic & { distanceKm?: number }>();

    // 1. Fetch PetVerse-registered partner clinics from MongoDB
    const hasCoordinates = typeof query.lat === 'number' && typeof query.lng === 'number';
    let petverseDocs: any[] = [];

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

      if (query.emergencyOnly) {
        pipeline.push({ $match: { emergencyAvailable: true } });
      }

      if (query.minRating) {
        pipeline.push({ $match: { 'ratings.avg': { $gte: query.minRating } } });
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

      try {
        petverseDocs = await ClinicModel.aggregate(pipeline).exec();
      } catch (geoErr) {
        logger.warn('[NearbyService] $geoNear failed (unindexed or missing 2dsphere in MongoDB), falling back to regular query', {
          error: (geoErr as any)?.message,
        });
        const fallbackFilter: any = {};
        if (query.type) fallbackFilter.type = query.type;
        if (query.emergencyOnly) fallbackFilter.emergencyAvailable = true;
        if (query.minRating) fallbackFilter['ratings.avg'] = { $gte: query.minRating };
        if (query.search) {
          fallbackFilter.$or = [
            { name: new RegExp(query.search, 'i') },
            { address: new RegExp(query.search, 'i') },
            { services: new RegExp(query.search, 'i') },
          ];
        }
        petverseDocs = await ClinicModel.find(fallbackFilter).lean().exec();
      }
    } else {
      const filter: any = {};
      if (query.type) filter.type = query.type;
      if (query.emergencyOnly) filter.emergencyAvailable = true;
      if (query.minRating) filter['ratings.avg'] = { $gte: query.minRating };
      if (query.search) {
        filter.$or = [
          { name: new RegExp(query.search, 'i') },
          { address: new RegExp(query.search, 'i') },
          { services: new RegExp(query.search, 'i') },
        ];
      }

      petverseDocs = await ClinicModel.find(filter)
        .sort({ 'ratings.avg': -1, createdAt: -1 })
        .limit(query.limit || 50)
        .lean()
        .exec();
    }

    // Normalize PetVerse partner clinics
    for (const doc of petverseDocs) {
      const distanceKm = doc.dist?.calculated
        ? Math.round((doc.dist.calculated / 1000) * 10) / 10
        : typeof query.lat === 'number' && typeof query.lng === 'number' && doc.location?.coordinates
        ? calculateDistanceKm(
            query.lat,
            query.lng,
            doc.location.coordinates[1],
            doc.location.coordinates[0]
          )
        : undefined;

      const clinicObj: IClinic & { distanceKm?: number } = {
        _id: doc._id.toString(),
        name: doc.name,
        ownerId: doc.ownerId?.toString(),
        type: doc.type,
        address: doc.address,
        locality: matchLocalityFromAddress(doc.address),
        location: doc.location,
        phone: doc.phone,
        email: doc.email,
        website: doc.website,
        services: doc.services || [],
        openingHours: doc.openingHours || {},
        photos: doc.photos || [],
        ratings: doc.ratings || { avg: 0, count: 0 },
        isVerified: doc.isVerified ?? true,
        emergencyAvailable: doc.emergencyAvailable ?? false,
        googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(doc.name)}+${encodeURIComponent(doc.address)}`,
        source: 'petverse',
        hasOnlineBooking: true,
        distanceKm,
      };

      clinicsMap.set(clinicObj._id, clinicObj);
    }

    // 2. Discover clinics via Google Places API (if configured and working) or 100% Free OpenStreetMap
    let discoveredSource: 'google_places' | 'openstreetmap' | 'none' = 'none';
    let hasGoogleResults = false;

    if (googlePlacesService.isConfigured()) {
      try {
        const placesResult = await googlePlacesService.discoverHyderabadClinics({
          lat: query.lat,
          lng: query.lng,
          radiusKm: query.radiusKm,
          search: query.search,
          locality: query.locality,
          emergencyOnly: query.emergencyOnly,
          openNow: query.openNow,
          minRating: query.minRating,
        });

        if (placesResult.isConfigured && placesResult.clinics && placesResult.clinics.length > 0) {
          discoveredSource = 'google_places';
          hasGoogleResults = true;
          for (const clinic of placesResult.clinics) {
            const existingKey = clinic.placeId || clinic._id;
            if (!clinicsMap.has(existingKey)) {
              clinicsMap.set(existingKey, clinic);
            }
          }
        }
      } catch (googleErr) {
        logger.warn('[NearbyService] Google Places call failed, falling back to OpenStreetMap', {
          error: (googleErr as any)?.message,
        });
      }
    }

    // If Google Places is NOT configured OR returned 0 clinics (e.g. invalid key, quota limit on Render, or restricted IP),
    // seamlessly fall back to 100% Free OpenStreetMap & verified Hyderabad directory so users never see 0 clinics or an error!
    if (!hasGoogleResults) {
      try {
        const osmResult = await osmPlacesService.discoverHyderabadClinics({
          lat: query.lat,
          lng: query.lng,
          radiusKm: query.radiusKm,
          search: query.search,
          locality: query.locality,
          emergencyOnly: query.emergencyOnly,
          openNow: query.openNow,
          minRating: query.minRating,
        });

        discoveredSource = 'openstreetmap';
        for (const clinic of osmResult.clinics) {
          const existingKey = clinic.placeId || clinic._id;
          if (!clinicsMap.has(existingKey)) {
            clinicsMap.set(existingKey, clinic);
          }
        }
      } catch (osmErr) {
        logger.error('[NearbyService] OpenStreetMap discovery failed', {
          error: (osmErr as any)?.message,
        });
      }
    }

    // Absolute fallback: If both online discovery calls returned 0 and no search filter was specified, load baseline VERIFIED_HYDERABAD_CLINICS
    if (clinicsMap.size === 0 && !query.search && !query.locality) {
      discoveredSource = 'openstreetmap';
      for (const clinic of VERIFIED_HYDERABAD_CLINICS) {
        clinicsMap.set(clinic.placeId || clinic._id, { ...clinic });
      }
    }

    let combined = Array.from(clinicsMap.values());

    // Filter by search keyword if provided
    if (query.search && query.search.trim().length > 0) {
      const q = query.search.toLowerCase().trim();
      combined = combined.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.address.toLowerCase().includes(q) ||
          (c.locality && c.locality.toLowerCase().includes(q)) ||
          (c.services && c.services.some((s) => s.toLowerCase().includes(q)))
      );
    }

    // Filter by locality if provided
    if (query.locality && query.locality.toLowerCase() !== 'all') {
      const loc = query.locality.toLowerCase();
      combined = combined.filter(
        (c) =>
          (c.locality && c.locality.toLowerCase().includes(loc)) ||
          c.address.toLowerCase().includes(loc) ||
          c.name.toLowerCase().includes(loc)
      );
    }

    // Filter by emergencyOnly
    if (query.emergencyOnly) {
      combined = combined.filter((c) => c.emergencyAvailable === true);
    }

    // Filter by openNow
    if (query.openNow) {
      combined = combined.filter((c) => c.isOpenNow === true);
    }

    // Filter by minRating
    if (typeof query.minRating === 'number' && query.minRating > 0) {
      combined = combined.filter((c) => (c.ratings?.avg ?? 0) >= query.minRating!);
    }

    // Sorting:
    // If user coordinates provided: distance ascending
    // Else: rating descending, review count descending
    if (typeof query.lat === 'number' && typeof query.lng === 'number') {
      combined.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    } else {
      combined.sort((a, b) => {
        const ratingA = a.ratings?.avg ?? 0;
        const ratingB = b.ratings?.avg ?? 0;
        if (ratingB !== ratingA) return ratingB - ratingA;
        return (b.ratings?.count ?? 0) - (a.ratings?.count ?? 0);
      });
    }

    const source: 'google_places' | 'openstreetmap' | 'petverse' | 'combined' | 'unconfigured' =
      petverseDocs.length > 0 && discoveredSource !== 'none'
        ? 'combined'
        : discoveredSource === 'openstreetmap'
        ? 'openstreetmap'
        : discoveredSource === 'google_places'
        ? 'google_places'
        : petverseDocs.length > 0
        ? 'petverse'
        : 'unconfigured';

    return {
      data: combined,
      total: combined.length,
      source,
    };
  },

  async getClinicById(id: string): Promise<IClinic> {
    // 1. Try finding in PetVerse database if valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      const clinic = await ClinicModel.findById(id).exec();
      if (clinic) {
        const json = clinic.toJSON() as unknown as IClinic;
        return {
          ...json,
          source: 'petverse',
          hasOnlineBooking: true,
          googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(json.name)}+${encodeURIComponent(json.address)}`,
        };
      }
    }

    // 2. Try fetching from Google Places Details API (supports Google Place IDs)
    if (googlePlacesService.isConfigured()) {
      const placeClinic = await googlePlacesService.getPlaceDetails(id);
      if (placeClinic) {
        return placeClinic;
      }
    }

    // 3. Try resolving from OpenStreetMap free directory
    const osmClinic = await osmPlacesService.getClinicById(id);
    if (osmClinic) {
      return osmClinic;
    }

    throw new NotFoundError('Clinic');
  },

  async getClinicReviews(clinicId: string) {
    if (!mongoose.Types.ObjectId.isValid(clinicId)) {
      return [];
    }
    return ReviewModel.find({ targetId: clinicId }).sort({ createdAt: -1 }).exec();
  },

  async addReview(
    clinicId: string,
    userId: string,
    data: { rating: number; comment: string }
  ) {
    if (!mongoose.Types.ObjectId.isValid(clinicId)) {
      throw new NotFoundError('Reviews can only be submitted for registered PetVerse clinics.');
    }
    const clinic = await ClinicModel.findById(clinicId).exec();
    if (!clinic) throw new NotFoundError('Clinic');

    const user = await UserModel.findById(userId).exec();
    const userName = user?.profile
      ? `${user.profile.firstName} ${user.profile.lastName}`
      : 'Pet Owner';
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
