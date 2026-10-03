import { GrowthLogModel, type IGrowthLogDocument } from '../models/growth.model';
import mongoose from 'mongoose';

export const growthRepository = {
  async create(data: Partial<IGrowthLogDocument>): Promise<IGrowthLogDocument> {
    return GrowthLogModel.create(data);
  },

  async findByPet(
    petId: string,
    query: { startDate?: string; endDate?: string; limit?: number } = {}
  ): Promise<IGrowthLogDocument[]> {
    const filter: any = { petId };

    if (query.startDate || query.endDate) {
      filter.recordedAt = {};
      if (query.startDate) filter.recordedAt.$gte = new Date(query.startDate);
      if (query.endDate) filter.recordedAt.$lte = new Date(query.endDate);
    }

    return GrowthLogModel.find(filter)
      .sort({ recordedAt: -1 })
      .limit(query.limit || 100)
      .exec();
  },

  async findById(growthId: string): Promise<IGrowthLogDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(growthId)) return null;
    return GrowthLogModel.findById(growthId).exec();
  },

  async updateById(
    growthId: string,
    data: Partial<IGrowthLogDocument>
  ): Promise<IGrowthLogDocument | null> {
    if (!mongoose.Types.ObjectId.isValid(growthId)) return null;
    return GrowthLogModel.findByIdAndUpdate(growthId, { $set: data }, { new: true }).exec();
  },

  async deleteById(growthId: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(growthId)) return false;
    const res = await GrowthLogModel.findByIdAndDelete(growthId).exec();
    return !!res;
  },

  async findLatestByPet(petId: string): Promise<IGrowthLogDocument | null> {
    return GrowthLogModel.findOne({ petId }).sort({ recordedAt: -1 }).exec();
  },
};
