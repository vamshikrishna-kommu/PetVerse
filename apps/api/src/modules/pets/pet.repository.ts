import type { FilterQuery, UpdateQuery } from 'mongoose';
import { PetModel, type IPetDocument } from './pet.model';

export const petRepository = {
  async findById(id: string): Promise<IPetDocument | null> {
    return PetModel.findById(id).exec();
  },

  async findByOwner(ownerId: string): Promise<IPetDocument[]> {
    return PetModel.find({ ownerId }).sort({ createdAt: -1 }).exec();
  },

  async findAll(
    filter: FilterQuery<IPetDocument>,
    sort: Record<string, 1 | -1>,
    skip: number,
    limit: number
  ): Promise<{ data: IPetDocument[]; total: number }> {
    const [data, total] = await Promise.all([
      PetModel.find(filter).sort(sort).skip(skip).limit(limit).exec(),
      PetModel.countDocuments(filter).exec(),
    ]);
    return { data, total };
  },

  async findByQrCode(qrCode: string): Promise<IPetDocument | null> {
    return PetModel.findOne({ qrCode }).exec();
  },

  async create(data: Partial<IPetDocument>): Promise<IPetDocument> {
    const pet = new PetModel(data);
    return pet.save();
  },

  async updateById(
    id: string,
    update: UpdateQuery<IPetDocument>
  ): Promise<IPetDocument | null> {
    return PetModel.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    }).exec();
  },

  async deleteById(id: string): Promise<boolean> {
    const result = await PetModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  },

  async count(filter: FilterQuery<IPetDocument> = {}): Promise<number> {
    return PetModel.countDocuments(filter).exec();
  },
};
