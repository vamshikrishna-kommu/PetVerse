import type { UpdateQuery } from 'mongoose';
import { SurgeryModel, type ISurgeryDocument } from '../models/surgery.model';

export const surgeryRepository = {
  async findById(id: string): Promise<ISurgeryDocument | null> {
    return SurgeryModel.findOne({ _id: id, isDeleted: { $ne: true } }).exec();
  },

  async findByPet(petId: string): Promise<ISurgeryDocument[]> {
    return SurgeryModel.find({ petId, isDeleted: { $ne: true } })
      .sort({ performedDate: -1, createdAt: -1 })
      .exec();
  },

  async create(data: Partial<ISurgeryDocument>): Promise<ISurgeryDocument> {
    const surgery = new SurgeryModel(data);
    return surgery.save();
  },

  async updateById(
    id: string,
    update: UpdateQuery<ISurgeryDocument>
  ): Promise<ISurgeryDocument | null> {
    return SurgeryModel.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { ...update, $inc: { version: 1 } },
      { new: true, runValidators: true }
    ).exec();
  },

  async softDelete(id: string, deletedBy: string): Promise<boolean> {
    const result = await SurgeryModel.updateOne(
      { _id: id, isDeleted: { $ne: true } },
      { isDeleted: true, deletedAt: new Date(), deletedBy }
    ).exec();
    return result.modifiedCount > 0;
  },

  async findRecovering(petId: string): Promise<ISurgeryDocument[]> {
    return SurgeryModel.find({
      petId,
      recoveryStatus: 'recovering',
      isDeleted: { $ne: true },
    }).exec();
  },
};
