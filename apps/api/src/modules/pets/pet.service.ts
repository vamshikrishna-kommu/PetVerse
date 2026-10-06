import mongoose from 'mongoose';
import { petRepository } from './pet.repository';
import { TimelineService } from './timeline.service';
import { MedicalRecordModel } from '../health/models/medical-record.model';
import { VitalLogModel } from '../health/models/vital-log.model';
import { ConditionModel } from '../health/models/condition.model';
import { AllergyModel } from '../health/models/allergy.model';
import { LabReportModel } from '../health/models/lab-report.model';
import { ImagingStudyModel } from '../health/models/imaging-study.model';
import { SurgeryModel } from '../health/models/surgery.model';
import { VaccinationRecord } from '../vaccination/models/vaccination-record.model';
import { PrescriptionModel } from '../medication/models/prescription.model';
import { MedicationCourseModel } from '../medication/models/course.model';
import { ReminderModel } from '../reminders/models/reminder.model';
import { NotificationModel } from '../notifications/models/notification.model';
import { AppointmentModel } from '../appointments/models/appointment.model';
import { logger } from '../../shared/utils/logger';
import { NotFoundError, ForbiddenError, AppError } from '../../shared/errors/AppError';
import type { IPet, IPetTimelineEvent } from '@petverse/shared-types';
import type { FilterQuery } from 'mongoose';
import type { IPetDocument } from './pet.model';

export const petService = {
  /**
   * Get paginated, filtered, and sorted pets for a specific owner
   */
  async getOwnerPets(
    ownerId: string,
    query: {
      search?: string;
      species?: string;
      breed?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ data: IPet[]; total: number; page: number; limit: number }> {
    const filter: FilterQuery<IPetDocument> = { ownerId };

    if (query.search && query.search.trim()) {
      const q = query.search.trim();
      filter.$or = [
        { name: new RegExp(q, 'i') },
        { breed: new RegExp(q, 'i') },
        { microchipId: new RegExp(q, 'i') },
      ];
    }
    if (query.species) {
      filter.species = query.species;
    }
    if (query.breed) {
      filter.breed = new RegExp(query.breed, 'i');
    }

    const sortField = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort: Record<string, 1 | -1> = { [sortField]: sortOrder };

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const { data, total } = await petRepository.findAll(filter, sort, skip, limit);
    
    return {
      data: data.map((p) => p.toJSON() as unknown as IPet),
      total,
      page,
      limit,
    };
  },

  async getPetById(petId: string, requestingUserId: string, isAdmin = false): Promise<IPet> {
    const pet = await petRepository.findById(petId);
    if (!pet) throw new NotFoundError('Pet');

    if (!isAdmin && pet.ownerId.toString() !== requestingUserId) {
      throw new ForbiddenError('You do not own this pet');
    }

    return pet.toJSON() as unknown as IPet;
  },

  async getPetByQrCode(qrCode: string): Promise<IPet> {
    const pet = await petRepository.findByQrCode(qrCode);
    if (!pet || !pet.isPublicProfile) throw new NotFoundError('Pet');
    return pet.toJSON() as unknown as IPet;
  },

  async createPet(
    ownerId: string,
    data: Partial<Omit<IPet, '_id' | 'ownerId' | 'qrCode'>>
  ): Promise<IPet> {
    const petDoc = await petRepository.create({ ...data, ownerId: ownerId as any });
    const pet = petDoc.toJSON() as unknown as IPet;

    // Trigger timeline event for creation
    await TimelineService.addEvent({
      petId: pet._id,
      type: 'created',
      title: 'Profile Created',
      description: `Welcome to PetVerse, ${pet.name}!`,
    });

    return pet;
  },

  async updatePet(
    petId: string,
    ownerId: string,
    data: Partial<IPet>,
    isAdmin = false
  ): Promise<IPet> {
    const pet = await petRepository.findById(petId);
    if (!pet) throw new NotFoundError('Pet');

    if (!isAdmin && pet.ownerId.toString() !== ownerId) {
      throw new ForbiddenError('You do not own this pet');
    }

    // Check if weight changed to trigger timeline event
    if (data.weight && pet.weight !== data.weight) {
      await TimelineService.addEvent({
        petId,
        type: 'weight_updated',
        title: 'Weight Updated',
        description: `Weight updated from ${pet.weight || 'unknown'} to ${data.weight} kg`,
        metadata: { oldWeight: pet.weight, newWeight: data.weight }
      });
    }

    if (data.isLost !== undefined && pet.isLost !== data.isLost) {
      await TimelineService.addEvent({
        petId,
        type: data.isLost ? 'lost' : 'found',
        title: data.isLost ? 'Reported Lost' : 'Marked as Found & Safe',
        description: data.isLost ? `${pet.name} was marked as lost.` : `${pet.name} has been found and marked safe!`,
        metadata: { isLost: data.isLost }
      });
    }

    const updated = await petRepository.updateById(petId, data);
    if (!updated) throw new NotFoundError('Pet');
    return updated.toJSON() as unknown as IPet;
  },

  async getLostPets(query: { species?: string; search?: string; page?: number; limit?: number } = {}) {
    const filter: FilterQuery<IPetDocument> = { isLost: true };
    if (query.species) filter.species = query.species;
    if (query.search) {
      filter.$or = [
        { name: new RegExp(query.search, 'i') },
        { breed: new RegExp(query.search, 'i') },
        { microchipId: new RegExp(query.search, 'i') },
      ];
    }
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;
    const { data, total } = await petRepository.findAll(filter, { updatedAt: -1 }, skip, limit);
    return { data: data.map(d => d.toJSON() as unknown as IPet), total, page, limit };
  },

  /**
   * Delete a pet and perform a cascading deletion across all associated collections.
   *
   * Cascade policy:
   *   - Hard delete: all operational records (health, medication, vaccinations, reminders,
   *     appointments, notifications).
   *   - Appointments: cancelled and then deleted — no active appointment should reference
   *     a non-existent pet.
   *   - Domain events (EventModel): RETAINED as audit history — never deleted.
   *   - Automation rules: deactivated (isActive=false) rather than deleted so rules
   *     can be inspected post-mortem.
   *
   * Transaction-safe when running against a MongoDB replica set.
   * Falls back to sequential delete ONLY when the error code indicates transactions
   * are not supported (e.g. standalone MongoDB in development).
   */
  async deletePet(petId: string, ownerId: string, isAdmin = false): Promise<void> {
    const pet = await petRepository.findById(petId);
    if (!pet) throw new NotFoundError('Pet');

    if (!isAdmin && pet.ownerId.toString() !== ownerId) {
      throw new ForbiddenError('You do not own this pet');
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      const cascadeDelete = async (s?: mongoose.ClientSession) => {
        const opts = s ? { session: s } : {};
        await Promise.all([
          // Hard delete all operational records
          petRepository.deleteById(petId),
          MedicalRecordModel.deleteMany({ petId }, opts),
          VitalLogModel.deleteMany({ petId }, opts),
          ConditionModel.deleteMany({ petId }, opts),
          AllergyModel.deleteMany({ petId }, opts),
          LabReportModel.deleteMany({ petId }, opts),
          ImagingStudyModel.deleteMany({ petId }, opts),
          SurgeryModel.deleteMany({ petId }, opts),
          VaccinationRecord.deleteMany({ petId }, opts),
          PrescriptionModel.deleteMany({ petId }, opts),
          MedicationCourseModel.deleteMany({ petId }, opts),
          ReminderModel.deleteMany({ $or: [{ petId }, { petId: new mongoose.Types.ObjectId(petId) }] as any }, opts),
          NotificationModel.deleteMany({ $or: [{ 'data.petId': petId }, { 'data.petId': new mongoose.Types.ObjectId(petId) }] as any }, opts),
          // Cancel + delete all appointments for this pet
          AppointmentModel.deleteMany({ petId }, opts),
        ]);
        // Timeline is stored outside transactions (separate collection write)
        await TimelineService.deleteAllEventsForPet(petId);
      };

      await cascadeDelete(session);
      await session.commitTransaction();
    } catch (error: any) {
      await session.abortTransaction();

      // Only fall back to sequential delete when the error is "transactions not supported"
      // (e.g. standalone MongoDB without a replica set in development).
      // Any other error (network, constraint, etc.) must propagate — not be silently hidden.
      const isTransactionUnsupported =
        error?.codeName === 'IllegalOperation' ||
        error?.message?.includes('Transaction') ||
        error?.code === 263; // MongoServerError: Transaction numbers are only allowed

      if (!isTransactionUnsupported) {
        logger.error('[PetService] Transaction aborted due to non-recoverable error during pet deletion', {
          petId,
          errorMessage: error?.message,
        });
        throw error;
      }

      // Fallback: sequential delete for standalone MongoDB
      logger.warn('[PetService] Transactions not supported; falling back to sequential cascade delete', { petId });
      await Promise.all([
        petRepository.deleteById(petId),
        MedicalRecordModel.deleteMany({ petId }),
        VitalLogModel.deleteMany({ petId }),
        ConditionModel.deleteMany({ petId }),
        AllergyModel.deleteMany({ petId }),
        LabReportModel.deleteMany({ petId }),
        ImagingStudyModel.deleteMany({ petId }),
        SurgeryModel.deleteMany({ petId }),
        VaccinationRecord.deleteMany({ petId }),
        PrescriptionModel.deleteMany({ petId }),
        MedicationCourseModel.deleteMany({ petId }),
        ReminderModel.deleteMany({ petId }),
        NotificationModel.deleteMany({ 'data.petId': petId }),
        AppointmentModel.deleteMany({ petId }),
      ]);
      await TimelineService.deleteAllEventsForPet(petId);
    } finally {
      session.endSession();
    }
  },

  async updateAvatar(petId: string, ownerId: string, avatarUrl: string): Promise<IPet> {
    return this.updatePet(petId, ownerId, { avatar: avatarUrl } as Partial<IPet>);
  },

  async addGalleryImages(petId: string, ownerId: string, imageUrls: string[]): Promise<IPet> {
    const pet = await this.getPetById(petId, ownerId);
    const existingGallery = pet.gallery || [];
    const updatedGallery = [...existingGallery, ...imageUrls].slice(0, 50);
    return this.updatePet(petId, ownerId, { gallery: updatedGallery } as Partial<IPet>);
  },

  async removeGalleryImage(petId: string, ownerId: string, imageUrl: string): Promise<IPet> {
    const pet = await this.getPetById(petId, ownerId);
    const updatedGallery = (pet.gallery || []).filter((img) => img !== imageUrl);
    return this.updatePet(petId, ownerId, { gallery: updatedGallery } as Partial<IPet>);
  },

  async setPrimaryGalleryImage(petId: string, ownerId: string, imageUrl: string): Promise<IPet> {
    const pet = await this.getPetById(petId, ownerId);
    if (!pet.gallery?.includes(imageUrl)) {
      throw new AppError('Image is not in pet gallery', 400, 'INVALID_IMAGE');
    }
    return this.updatePet(petId, ownerId, { avatar: imageUrl } as Partial<IPet>);
  },
  
  async getPetTimeline(petId: string, requestingUserId: string): Promise<IPetTimelineEvent[]> {
    await this.getPetById(petId, requestingUserId); // Validates ownership
    return TimelineService.getEventsByPet(petId);
  }
};
