import type { UpdateQuery } from 'mongoose';
import { ImagingStudyModel, type IImagingStudyDocument } from '../models/imaging-study.model';

export const imagingStudyRepository = {
  async findById(id: string): Promise<IImagingStudyDocument | null> {
    return ImagingStudyModel.findOne({ _id: id, isDeleted: { $ne: true } }).exec();
  },

  async findByPet(
    petId: string,
    skip = 0,
    limit = 20
  ): Promise<{ data: IImagingStudyDocument[]; total: number }> {
    const query = { petId, isDeleted: { $ne: true } };
    const [data, total] = await Promise.all([
      ImagingStudyModel.find(query)
        .sort({ performedDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      ImagingStudyModel.countDocuments(query).exec(),
    ]);
    return { data, total };
  },

  async create(data: Partial<IImagingStudyDocument>): Promise<IImagingStudyDocument> {
    const study = new ImagingStudyModel(data);
    return study.save();
  },

  async updateById(
    id: string,
    update: UpdateQuery<IImagingStudyDocument>
  ): Promise<IImagingStudyDocument | null> {
    return ImagingStudyModel.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { ...update, $inc: { version: 1 } },
      { new: true, runValidators: true }
    ).exec();
  },

  async softDelete(id: string, deletedBy: string): Promise<boolean> {
    const result = await ImagingStudyModel.updateOne(
      { _id: id, isDeleted: { $ne: true } },
      { isDeleted: true, deletedAt: new Date(), deletedBy }
    ).exec();
    return result.modifiedCount > 0;
  },
};
