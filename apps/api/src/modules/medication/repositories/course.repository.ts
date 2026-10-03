import type { UpdateQuery } from 'mongoose';
import { MedicationCourseModel, MedicationAdministrationModel, MedicationComplianceModel, type IMedicationCourseDocument, type IMedicationAdministrationDocument, type IMedicationComplianceDocument } from '../models/course.model';

export const courseRepository = {
  async findById(id: string): Promise<IMedicationCourseDocument | null> {
    return MedicationCourseModel.findOne({ _id: id, isDeleted: { $ne: true } }).exec();
  },

  async findByPet(petId: string): Promise<IMedicationCourseDocument[]> {
    return MedicationCourseModel.find({ petId, isDeleted: { $ne: true } }).exec();
  },

  async create(data: Partial<IMedicationCourseDocument>): Promise<IMedicationCourseDocument> {
    return new MedicationCourseModel(data).save();
  },

  async updateById(id: string, update: UpdateQuery<IMedicationCourseDocument>): Promise<IMedicationCourseDocument | null> {
    return MedicationCourseModel.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      update,
      { new: true, runValidators: true }
    ).exec();
  },
};

export const administrationRepository = {
  async findByCourse(courseId: string): Promise<IMedicationAdministrationDocument[]> {
    return MedicationAdministrationModel.find({ courseId, isDeleted: { $ne: true } })
      .sort({ scheduledAt: -1 }).exec();
  },

  async findRecentByPet(petId: string, limit = 10): Promise<IMedicationAdministrationDocument[]> {
    return MedicationAdministrationModel.find({ petId, isDeleted: { $ne: true } })
      .sort({ administeredAt: -1 }).limit(limit).exec();
  },

  async create(data: Partial<IMedicationAdministrationDocument>): Promise<IMedicationAdministrationDocument> {
    return new MedicationAdministrationModel(data).save();
  }
};

export const complianceRepository = {
  async findByPetAndCourse(petId: string, courseId: string): Promise<IMedicationComplianceDocument | null> {
    return MedicationComplianceModel.findOne({ petId, courseId, isDeleted: { $ne: true } }).exec();
  },

  async upsert(petId: string, courseId: string, data: Partial<IMedicationComplianceDocument>): Promise<IMedicationComplianceDocument> {
    return MedicationComplianceModel.findOneAndUpdate(
      { petId, courseId, isDeleted: { $ne: true } },
      { $set: data },
      { new: true, upsert: true, runValidators: true }
    ).exec();
  }
};
