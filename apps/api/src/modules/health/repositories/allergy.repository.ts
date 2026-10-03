import type { UpdateQuery } from 'mongoose';
import { AllergyModel, type IAllergyDocument } from '../models/allergy.model';

export const allergyRepository = {
  async findById(id: string): Promise<IAllergyDocument | null> {
    return AllergyModel.findOne({ _id: id, isDeleted: { $ne: true } }).exec();
  },

  async findByPet(petId: string): Promise<IAllergyDocument[]> {
    return AllergyModel.find({ petId, isDeleted: { $ne: true } })
      .sort({ isEmergencyFlag: -1, severity: -1, createdAt: -1 })
      .exec();
  },

  async findEmergencyByPet(petId: string): Promise<IAllergyDocument[]> {
    return AllergyModel.find({
      petId,
      isEmergencyFlag: true,
      isDeleted: { $ne: true },
    }).exec();
  },

  async create(data: Partial<IAllergyDocument>): Promise<IAllergyDocument> {
    const allergy = new AllergyModel(data);
    return allergy.save();
  },

  async updateById(
    id: string,
    update: UpdateQuery<IAllergyDocument>
  ): Promise<IAllergyDocument | null> {
    return AllergyModel.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      update,
      { new: true, runValidators: true }
    ).exec();
  },

  async softDelete(id: string, deletedBy: string): Promise<boolean> {
    const result = await AllergyModel.updateOne(
      { _id: id, isDeleted: { $ne: true } },
      { isDeleted: true, deletedAt: new Date(), deletedBy }
    ).exec();
    return result.modifiedCount > 0;
  },

  async hasEmergencyAllergies(petId: string): Promise<boolean> {
    const count = await AllergyModel.countDocuments({
      petId,
      isEmergencyFlag: true,
      isDeleted: { $ne: true },
    }).exec();
    return count > 0;
  },
};
