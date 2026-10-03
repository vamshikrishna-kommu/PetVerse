import type { FilterQuery, UpdateQuery } from 'mongoose';
import { MedicalRecordModel, type IMedicalRecordDocument } from '../models/medical-record.model';

export const medicalRecordRepository = {
  async findById(id: string): Promise<IMedicalRecordDocument | null> {
    return MedicalRecordModel.findOne({ _id: id, isDeleted: { $ne: true } }).exec();
  },

  async findByPet(
    petId: string,
    filter: FilterQuery<IMedicalRecordDocument> = {},
    sort: Record<string, 1 | -1> = { visitDate: -1 },
    skip = 0,
    limit = 20
  ): Promise<{ data: IMedicalRecordDocument[]; total: number }> {
    const query = { ...filter, petId, isDeleted: { $ne: true } };
    const [data, total] = await Promise.all([
      MedicalRecordModel.find(query).sort(sort).skip(skip).limit(limit).exec(),
      MedicalRecordModel.countDocuments(query).exec(),
    ]);
    return { data, total };
  },

  async create(data: Partial<IMedicalRecordDocument>): Promise<IMedicalRecordDocument> {
    const record = new MedicalRecordModel(data);
    return record.save();
  },

  async updateById(
    id: string,
    update: UpdateQuery<IMedicalRecordDocument>
  ): Promise<IMedicalRecordDocument | null> {
    return MedicalRecordModel.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { ...update, $inc: { version: 1 } },
      { new: true, runValidators: true }
    ).exec();
  },

  async softDelete(id: string, deletedBy: string): Promise<boolean> {
    const result = await MedicalRecordModel.updateOne(
      { _id: id, isDeleted: { $ne: true } },
      { isDeleted: true, deletedAt: new Date(), deletedBy }
    ).exec();
    return result.modifiedCount > 0;
  },

  async count(filter: FilterQuery<IMedicalRecordDocument> = {}): Promise<number> {
    return MedicalRecordModel.countDocuments({
      ...filter,
      isDeleted: { $ne: true },
    }).exec();
  },

  async findByPetAndStatus(
    petId: string,
    status: string,
    limit = 5
  ): Promise<IMedicalRecordDocument[]> {
    return MedicalRecordModel.find({ petId, status, isDeleted: { $ne: true } })
      .sort({ visitDate: -1 })
      .limit(limit)
      .exec();
  },

  async findPendingFollowUps(petId: string): Promise<IMedicalRecordDocument[]> {
    const today = new Date().toISOString().split('T')[0];
    return MedicalRecordModel.find({
      petId,
      followUpDate: { $lte: today },
      status: 'active',
      isDeleted: { $ne: true },
    })
      .sort({ followUpDate: 1 })
      .exec();
  },
};
