import type { UpdateQuery } from 'mongoose';
import { VaccineDefinition, type IVaccineDefinitionDocument } from '../models/vaccine-definition.model';

export const vaccineDefinitionRepository = {
  async findById(id: string): Promise<IVaccineDefinitionDocument | null> {
    return VaccineDefinition.findOne({ _id: id, isDeleted: { $ne: true } }).exec();
  },

  async findAllActive(): Promise<IVaccineDefinitionDocument[]> {
    return VaccineDefinition.find({ isActive: true, isDeleted: { $ne: true } })
      .sort({ category: 1, name: 1 })
      .exec();
  },

  async findBySpecies(species: string): Promise<IVaccineDefinitionDocument[]> {
    return VaccineDefinition.find({
      species: { $in: [species] },
      isActive: true,
      isDeleted: { $ne: true },
    })
      .sort({ category: 1, name: 1 })
      .exec();
  },

  async create(data: Partial<IVaccineDefinitionDocument>): Promise<IVaccineDefinitionDocument> {
    const doc = new VaccineDefinition(data);
    return doc.save();
  },

  async updateById(
    id: string,
    update: UpdateQuery<IVaccineDefinitionDocument>
  ): Promise<IVaccineDefinitionDocument | null> {
    return VaccineDefinition.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      update,
      { new: true, runValidators: true }
    ).exec();
  },

  async softDelete(id: string, deletedBy: string): Promise<boolean> {
    const result = await VaccineDefinition.updateOne(
      { _id: id, isDeleted: { $ne: true } },
      { isDeleted: true, isActive: false }
    ).exec();
    return result.modifiedCount > 0;
  },
};
