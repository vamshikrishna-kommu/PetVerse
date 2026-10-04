import { ClinicModel, type IClinicDocument } from '../../appointments/models/clinic.model';
import { ReviewModel } from '../models/review.model';
import { UserModel } from '../../users/user.model';
import { NotFoundError, AppError } from '../../../shared/errors/AppError';
import type { IClinic } from '@petverse/shared-types';
import mongoose from 'mongoose';
import { env } from '../../../config/env';

export const nearbyService = {
  /** Seed initial verified clinics if database has 0 clinics (development/test only — NEVER in production) */
  /** Seed initial verified clinics if database has 0 clinics or missing Hyderabad clinics (development/test only — NEVER in production) */
  async seedClinicsIfEmpty(): Promise<void> {
    if (env.NODE_ENV === 'production' || process.env.NODE_ENV === 'production') {
      return;
    }

    const dummyOwnerId = new mongoose.Types.ObjectId();

    const verifiedClinics = [
      // ─── Hyderabad (Premier Localities & Emergency Hubs) ───────────
      {
        name: 'Olive Pet Hospital & 24/7 Emergency Care',
        ownerId: dummyOwnerId,
        type: 'emergency_hospital',
        address: 'Road No. 10, Singada Kunta, Banjara Hills, Hyderabad, TS 500034',
        location: { type: 'Point', coordinates: [78.4350, 17.4150] },
        phone: '+91 40 2335 1199',
        email: 'emergency@olivepethospital.com',
        website: 'https://olivepethospital.com',
        services: ['24/7 ICU & Critical Care', 'Digital X-Ray', 'Blood Transfusion', 'Orthopedic Surgery', 'Emergency Oxygen'],
        ratings: { avg: 4.9, count: 480 },
        isVerified: true,
        emergencyAvailable: true,
      },
      {
        name: 'Super Vets 24/7 Multi-Specialty Pet Hospital',
        ownerId: dummyOwnerId,
        type: 'emergency_hospital',
        address: 'Plot 18, Near Bio-Diversity Junction, Gachibowli, Hyderabad, TS 500032',
        location: { type: 'Point', coordinates: [78.3650, 17.4400] },
        phone: '+91 40 4855 7799',
        email: 'care@supervets.in',
        website: 'https://supervets.in',
        services: ['24/7 Trauma Care', 'Laparoscopic Surgery', 'Color Doppler Ultrasound', 'Critical Care ICU', 'In-house Pharmacy'],
        ratings: { avg: 4.8, count: 395 },
        isVerified: true,
        emergencyAvailable: true,
      },
      {
        name: 'Pet Care Multi-Speciality Veterinary Hospital',
        ownerId: dummyOwnerId,
        type: 'veterinary_clinic',
        address: 'Plot 722, Road No. 36, Jubilee Hills, Hyderabad, TS 500033',
        location: { type: 'Point', coordinates: [78.4060, 17.4320] },
        phone: '+91 40 2355 8822',
        email: 'info@petcarejubileehills.com',
        website: 'https://petcarejubileehills.com',
        services: ['Internal Medicine', 'Cardiology', 'Soft Tissue & Bone Surgery', 'Veterinary Dentistry', 'Diagnostic Pathology'],
        ratings: { avg: 4.8, count: 310 },
        isVerified: true,
        emergencyAvailable: true,
      },
      {
        name: 'Dr. Dog Veterinary Clinic & Surgical Centre',
        ownerId: dummyOwnerId,
        type: 'veterinary_clinic',
        address: 'Plot 12, Kavuri Hills, Madhapur, Hitec City, Hyderabad, TS 500081',
        location: { type: 'Point', coordinates: [78.3910, 17.4480] },
        phone: '+91 40 4012 3344',
        email: 'contact@drdogclinic.com',
        services: ['Routine Consultations', 'Preventive Vaccinations', 'Microchipping', 'Dental Scaling', 'Pet Wellness Packages'],
        ratings: { avg: 4.7, count: 245 },
        isVerified: true,
        emergencyAvailable: false,
      },
      {
        name: 'Blue Cross of Hyderabad (Rescue, Clinic & Shelter)',
        ownerId: dummyOwnerId,
        type: 'veterinary_clinic',
        address: '403/9, Road No. 35, Jubilee Hills, Hyderabad, TS 500033',
        location: { type: 'Point', coordinates: [78.4230, 17.4260] },
        phone: '+91 40 2354 4355',
        email: 'info@bluecrosshyd.org',
        website: 'https://bluecrosshyd.org',
        services: ['24/7 Rescue & Treatment', 'Anti-Rabies Vaccination', 'Spay & Neuter', 'Emergency Trauma Care', 'Adoption Services'],
        ratings: { avg: 4.9, count: 620 },
        isVerified: true,
        emergencyAvailable: true,
      },
      {
        name: 'The Ark Veterinary Clinic & Diagnostics',
        ownerId: dummyOwnerId,
        type: 'veterinary_clinic',
        address: 'Telecom Nagar, Gachibowli, Hyderabad, TS 500032',
        location: { type: 'Point', coordinates: [78.3580, 17.4360] },
        phone: '+91 40 6789 1234',
        email: 'support@arkvetclinic.in',
        services: ['General Health Checkups', 'Deworming & Immunization', 'Dermatology & Allergy Care', 'Ophthalmology', 'Dietary Consultation'],
        ratings: { avg: 4.7, count: 188 },
        isVerified: true,
        emergencyAvailable: false,
      },
      {
        name: 'Furry Paws Luxury Pet Grooming & Spa',
        ownerId: dummyOwnerId,
        type: 'groomer',
        address: 'Road No. 45, Nandagiri Hills, Jubilee Hills, Hyderabad, TS 500033',
        location: { type: 'Point', coordinates: [78.4110, 17.4380] },
        phone: '+91 91000 88221',
        email: 'appointments@furrypawshyd.com',
        services: ['Medicated Herbal Bath', 'Breed-Specific Coat Styling', 'Aromatherapy Pet Spa', 'De-Shedding & Mat Removal', 'Ear & Paw Care'],
        ratings: { avg: 4.9, count: 275 },
        isVerified: true,
        emergencyAvailable: false,
      },
      {
        name: 'Pet Universe Veterinary Care & Luxury Boarding',
        ownerId: dummyOwnerId,
        type: 'boarding',
        address: 'Kothaguda X Roads, Kondapur, Hyderabad, TS 500084',
        location: { type: 'Point', coordinates: [78.3680, 17.4640] },
        phone: '+91 40 2988 5566',
        email: 'stay@petuniversehyd.com',
        services: ['Climate-Controlled Boarding Suites', '24/7 Vet on Call', 'Outdoor Agility Play Yards', 'Daily Video Updates', 'Custom Meal Plans'],
        ratings: { avg: 4.8, count: 215 },
        isVerified: true,
        emergencyAvailable: false,
      },
      {
        name: 'Vet N Pet Polyclinic & Surgical Facility',
        ownerId: dummyOwnerId,
        type: 'veterinary_clinic',
        address: 'Road No. 1, KPHB Colony Phase 1, Kukatpally, Hyderabad, TS 500072',
        location: { type: 'Point', coordinates: [78.3990, 17.4930] },
        phone: '+91 40 2315 6789',
        email: 'kukatpally@vetnpet.in',
        services: ['Emergency Care', 'Fracture Repair', 'Vaccination & Deworming', 'Digital Ultrasound', 'Post-Op Critical Care'],
        ratings: { avg: 4.6, count: 190 },
        isVerified: true,
        emergencyAvailable: true,
      },
      {
        name: 'Secunderabad Veterinary Polyclinic & Hospital',
        ownerId: dummyOwnerId,
        type: 'veterinary_clinic',
        address: 'M.G. Road, Near Clock Tower, Secunderabad, TS 500003',
        location: { type: 'Point', coordinates: [78.4980, 17.4390] },
        phone: '+91 40 2780 4422',
        email: 'care@secunderabadvet.org',
        services: ['General Practice', 'Orthopedic Surgery', 'Canine Blood Banking', 'Clinical Lab Diagnostics', '24/7 Emergency'],
        ratings: { avg: 4.7, count: 340 },
        isVerified: true,
        emergencyAvailable: true,
      },
      {
        name: 'Canine & Feline Pet Hospital',
        ownerId: dummyOwnerId,
        type: 'veterinary_clinic',
        address: 'Plot 48, Defence Colony, Sainikpuri, Secunderabad, TS 500094',
        location: { type: 'Point', coordinates: [78.5450, 17.4870] },
        phone: '+91 40 2711 9900',
        email: 'help@caninefelinevet.com',
        services: ['Puppy & Kitten Wellness', 'Geriatric Pet Health', 'Full Hematology Lab', 'Dental Scaling', 'Pet Pharmacy'],
        ratings: { avg: 4.8, count: 165 },
        isVerified: true,
        emergencyAvailable: false,
      },
      {
        name: 'Government Veterinary Super Specialty Hospital',
        ownerId: dummyOwnerId,
        type: 'veterinary_clinic',
        address: 'Narayanguda Main Road, Himayatnagar, Hyderabad, TS 500029',
        location: { type: 'Point', coordinates: [78.4910, 17.3980] },
        phone: '+91 40 2475 2200',
        email: 'info@telanganavethospital.gov.in',
        services: ['State-of-the-Art Surgery', 'Advanced Radiology & CT', 'State Diagnostic Lab', 'Subsidized Medicine', '24/7 Casualty'],
        ratings: { avg: 4.6, count: 520 },
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
        ratings: { avg: 4.7, count: 210 },
        isVerified: true,
        emergencyAvailable: true,
      },
      // ─── Other Key Indian Metros ─────────────────────────────────
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
    ];

    const currentCount = await ClinicModel.countDocuments();
    if (currentCount === 0) {
      await ClinicModel.create(verifiedClinics);
    } else {
      // Upsert any missing verified clinics (e.g. adding Hyderabad clinics to an existing DB)
      for (const clinic of verifiedClinics) {
        await ClinicModel.updateOne(
          { name: clinic.name },
          { $setOnInsert: clinic },
          { upsert: true }
        );
      }
    }
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
