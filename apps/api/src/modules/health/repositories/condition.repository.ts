import type { UpdateQuery } from 'mongoose';
import { ConditionModel, type IConditionDocument } from '../models/condition.model';

export const conditionRepository = {
  async findById(id: string): Promise<IConditionDocument | null> {
    return ConditionModel.findOne({ _id: id, isDeleted: { $ne: true } }).exec();
  },

  async findByPet(petId: string): Promise<IConditionDocument[]> {
    return ConditionModel.find({ petId, isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .exec();
  },

  async findActiveByPet(petId: string): Promise<IConditionDocument[]> {
    return ConditionModel.find({
      petId,
      status: { $in: ['active', 'monitoring', 'recurring'] },
      isDeleted: { $ne: true },
    })
      .sort({ severity: -1, createdAt: -1 })
      .exec();
  },

  async create(data: Partial<IConditionDocument>): Promise<IConditionDocument> {
    const condition = new ConditionModel(data);
    return condition.save();
  },

  async updateById(
    id: string,
    update: UpdateQuery<IConditionDocument>
  ): Promise<IConditionDocument | null> {
    return ConditionModel.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { ...update, $inc: { version: 1 } },
      { new: true, runValidators: true }
    ).exec();
  },

  async softDelete(id: string, deletedBy: string): Promise<boolean> {
    const result = await ConditionModel.updateOne(
      { _id: id, isDeleted: { $ne: true } },
      { isDeleted: true, deletedAt: new Date(), deletedBy }
    ).exec();
    return result.modifiedCount > 0;
  },

  async countActive(petId: string): Promise<number> {
    return ConditionModel.countDocuments({
      petId,
      status: { $in: ['active', 'monitoring', 'recurring'] },
      isDeleted: { $ne: true },
    }).exec();
  },
};
