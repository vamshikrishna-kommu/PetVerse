import type { UpdateQuery } from 'mongoose';
import { MedicationModel, MedicationCategoryModel, type IMedicationDocument, type IMedicationCategoryDocument } from '../models/medication.model';

export const medicationCategoryRepository = {
  async findAll(): Promise<IMedicationCategoryDocument[]> {
    return MedicationCategoryModel.find({ isDeleted: { $ne: true } }).exec();
  },
  async findById(id: string): Promise<IMedicationCategoryDocument | null> {
    return MedicationCategoryModel.findOne({ _id: id, isDeleted: { $ne: true } }).exec();
  },
  async create(data: Partial<IMedicationCategoryDocument>): Promise<IMedicationCategoryDocument> {
    return new MedicationCategoryModel(data).save();
  },
};

export const medicationRepository = {
  async findById(id: string): Promise<IMedicationDocument | null> {
    return MedicationModel.findOne({ _id: id, isDeleted: { $ne: true } }).exec();
  },

  async findAllActive(): Promise<IMedicationDocument[]> {
    return MedicationModel.find({ isActive: true, isDeleted: { $ne: true } }).exec();
  },

  async search(query: string): Promise<IMedicationDocument[]> {
    return MedicationModel.find(
      { $text: { $search: query }, isDeleted: { $ne: true } },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } }).exec();
  },

  async findByCategory(categoryId: string): Promise<IMedicationDocument[]> {
    return MedicationModel.find({ categoryId, isDeleted: { $ne: true } }).exec();
  },

  async create(data: Partial<IMedicationDocument>): Promise<IMedicationDocument> {
    return new MedicationModel(data).save();
  },

  async updateById(id: string, update: UpdateQuery<IMedicationDocument>): Promise<IMedicationDocument | null> {
    return MedicationModel.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      update,
      { new: true, runValidators: true }
    ).exec();
  },

  async softDelete(id: string, deletedBy: string): Promise<boolean> {
    const result = await MedicationModel.updateOne(
      { _id: id, isDeleted: { $ne: true } },
      { isDeleted: true, deletedAt: new Date().toISOString(), deletedBy }
    ).exec();
    return result.modifiedCount > 0;
  }
};
