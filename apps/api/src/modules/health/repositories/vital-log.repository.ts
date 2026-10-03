import type { FilterQuery } from 'mongoose';
import { VitalLogModel, type IVitalLogDocument } from '../models/vital-log.model';

export const vitalLogRepository = {
  async findById(id: string): Promise<IVitalLogDocument | null> {
    return VitalLogModel.findById(id).exec();
  },

  async findByPet(
    petId: string,
    filter: FilterQuery<IVitalLogDocument> = {},
    sort: Record<string, 1 | -1> = { recordedAt: -1 },
    skip = 0,
    limit = 50
  ): Promise<{ data: IVitalLogDocument[]; total: number }> {
    const query = { ...filter, petId };
    const [data, total] = await Promise.all([
      VitalLogModel.find(query).sort(sort).skip(skip).limit(limit).exec(),
      VitalLogModel.countDocuments(query).exec(),
    ]);
    return { data, total };
  },

  async findLatestByPet(petId: string): Promise<IVitalLogDocument | null> {
    return VitalLogModel.findOne({ petId }).sort({ recordedAt: -1 }).exec();
  },

  // For trend charts: weight/temperature/etc over time
  async findWeightTrend(
    petId: string,
    limit = 30
  ): Promise<Array<{ date: string; weight: number }>> {
    const records = await VitalLogModel.find({ petId, weight: { $exists: true } })
      .sort({ recordedAt: -1 })
      .limit(limit)
      .select('recordedAt weight')
      .lean()
      .exec();

    return records
      .filter((r) => r.weight !== undefined)
      .map((r) => ({ date: r.recordedAt, weight: r.weight as number }))
      .reverse(); // oldest first for charts
  },

  async findTrend(
    petId: string,
    field: 'weight' | 'temperature' | 'pulse' | 'oxygenSaturation',
    limit = 30
  ): Promise<Array<{ date: string; value: number }>> {
    const records = await VitalLogModel.find({ petId, [field]: { $exists: true } })
      .sort({ recordedAt: -1 })
      .limit(limit)
      .select(`recordedAt ${field}`)
      .lean()
      .exec();

    return records
      .filter((r) => (r as Record<string, unknown>)[field] !== undefined)
      .map((r) => ({
        date: r.recordedAt,
        value: (r as Record<string, unknown>)[field] as number,
      }))
      .reverse();
  },

  async create(data: Partial<IVitalLogDocument>): Promise<IVitalLogDocument> {
    const log = new VitalLogModel(data);
    return log.save();
  },

  async deleteById(id: string): Promise<boolean> {
    const result = await VitalLogModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  },

  async findSinceDate(petId: string, sinceDate: string): Promise<IVitalLogDocument[]> {
    return VitalLogModel.find({ petId, recordedAt: { $gte: sinceDate } })
      .sort({ recordedAt: -1 })
      .exec();
  },
};
