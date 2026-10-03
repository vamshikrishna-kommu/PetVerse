import type { UpdateQuery } from 'mongoose';
import { PrescriptionModel, PrescriptionItemModel, type IPrescriptionDocument, type IPrescriptionItemDocument } from '../models/prescription.model';

export const prescriptionRepository = {
  async findById(id: string): Promise<IPrescriptionDocument | null> {
    return PrescriptionModel.findOne({ _id: id, isDeleted: { $ne: true } }).exec();
  },

  async findByPet(petId: string): Promise<IPrescriptionDocument[]> {
    return PrescriptionModel.find({ petId, isDeleted: { $ne: true } }).sort({ issuedAt: -1 }).exec();
  },

  async findActiveByPet(petId: string): Promise<IPrescriptionDocument[]> {
    return PrescriptionModel.find({ petId, status: 'active', isDeleted: { $ne: true } }).exec();
  },

  async create(data: Partial<IPrescriptionDocument>): Promise<IPrescriptionDocument> {
    return new PrescriptionModel(data).save();
  },

  async updateById(id: string, update: UpdateQuery<IPrescriptionDocument>): Promise<IPrescriptionDocument | null> {
    return PrescriptionModel.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      update,
      { new: true, runValidators: true }
    ).exec();
  },
};

export const prescriptionItemRepository = {
  async findByPrescription(prescriptionId: string): Promise<IPrescriptionItemDocument[]> {
    return PrescriptionItemModel.find({ prescriptionId, isDeleted: { $ne: true } }).exec();
  },

  async createMany(items: any[]): Promise<IPrescriptionItemDocument[]> {
    return PrescriptionItemModel.insertMany(items) as unknown as IPrescriptionItemDocument[];
  }
};
