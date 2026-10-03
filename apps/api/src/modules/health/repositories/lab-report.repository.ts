import type { UpdateQuery } from 'mongoose';
import { LabReportModel, type ILabReportDocument } from '../models/lab-report.model';

export const labReportRepository = {
  async findById(id: string): Promise<ILabReportDocument | null> {
    return LabReportModel.findOne({ _id: id, isDeleted: { $ne: true } }).exec();
  },

  async findByPet(
    petId: string,
    filter: Record<string, unknown> = {},
    skip = 0,
    limit = 20
  ): Promise<{ data: ILabReportDocument[]; total: number }> {
    const query = { ...filter, petId, isDeleted: { $ne: true } };
    const [data, total] = await Promise.all([
      LabReportModel.find(query).sort({ resultDate: -1, createdAt: -1 }).skip(skip).limit(limit).exec(),
      LabReportModel.countDocuments(query).exec(),
    ]);
    return { data, total };
  },

  async create(data: Partial<ILabReportDocument>): Promise<ILabReportDocument> {
    const report = new LabReportModel(data);
    return report.save();
  },

  async updateById(
    id: string,
    update: UpdateQuery<ILabReportDocument>
  ): Promise<ILabReportDocument | null> {
    return LabReportModel.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { ...update, $inc: { version: 1 } },
      { new: true, runValidators: true }
    ).exec();
  },

  async softDelete(id: string, deletedBy: string): Promise<boolean> {
    const result = await LabReportModel.updateOne(
      { _id: id, isDeleted: { $ne: true } },
      { isDeleted: true, deletedAt: new Date(), deletedBy }
    ).exec();
    return result.modifiedCount > 0;
  },

  // For analytics: find labs with abnormal results
  async findAbnormal(petId: string, limit = 5): Promise<ILabReportDocument[]> {
    return LabReportModel.find({
      petId,
      abnormalCount: { $gt: 0 },
      isDeleted: { $ne: true },
    })
      .sort({ resultDate: -1 })
      .limit(limit)
      .exec();
  },
};
