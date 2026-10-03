import type { UpdateQuery } from 'mongoose';
import { VaccinationRecord, type IVaccinationRecordDocument } from '../models/vaccination-record.model';

export const vaccinationRecordRepository = {
  async findById(id: string): Promise<IVaccinationRecordDocument | null> {
    return VaccinationRecord.findOne({ _id: id, isDeleted: { $ne: true } })
      .populate('vaccineId')
      .exec();
  },

  async findByPet(petId: string): Promise<IVaccinationRecordDocument[]> {
    return VaccinationRecord.find({ petId, isDeleted: { $ne: true } })
      .populate('vaccineId')
      .sort({ createdAt: -1 })
      .exec();
  },

  async findActiveByPet(petId: string): Promise<IVaccinationRecordDocument[]> {
    return VaccinationRecord.find({
      petId,
      status: { $in: ['in_progress', 'completed'] },
      isDeleted: { $ne: true },
    })
      .populate('vaccineId')
      .exec();
  },

  async create(data: Partial<IVaccinationRecordDocument>): Promise<IVaccinationRecordDocument> {
    const record = new VaccinationRecord(data);
    return record.save();
  },

  async updateById(
    id: string,
    update: UpdateQuery<IVaccinationRecordDocument>
  ): Promise<IVaccinationRecordDocument | null> {
    return VaccinationRecord.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      update,
      { new: true, runValidators: true }
    ).populate('vaccineId').exec();
  },

  async softDelete(id: string, deletedBy: string, isAdmin: boolean = false): Promise<boolean> {
    const filter: Record<string, any> = { _id: id, isDeleted: { $ne: true } };
    if (!isAdmin) {
      filter.ownerId = deletedBy;
    }
    const result = await VaccinationRecord.updateOne(
      filter,
      { isDeleted: true, deletedAt: new Date().toISOString(), deletedBy }
    ).exec();
    return result.modifiedCount > 0;
  },
};
