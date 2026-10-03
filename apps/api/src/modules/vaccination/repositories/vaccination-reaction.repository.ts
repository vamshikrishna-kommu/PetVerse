import type { UpdateQuery } from 'mongoose';
import { VaccinationReaction, type IVaccinationReactionDocument } from '../models/vaccination-reaction.model';

export const vaccinationReactionRepository = {
  async findById(id: string): Promise<IVaccinationReactionDocument | null> {
    return VaccinationReaction.findOne({ _id: id, isDeleted: { $ne: true } }).exec();
  },

  async findByPet(petId: string): Promise<IVaccinationReactionDocument[]> {
    return VaccinationReaction.find({ petId, isDeleted: { $ne: true } })
      .sort({ onsetDateTime: -1 })
      .exec();
  },

  async findByRecord(vaccinationRecordId: string): Promise<IVaccinationReactionDocument[]> {
    return VaccinationReaction.find({ vaccinationRecordId, isDeleted: { $ne: true } }).exec();
  },

  async create(data: Partial<IVaccinationReactionDocument>): Promise<IVaccinationReactionDocument> {
    const record = new VaccinationReaction(data);
    return record.save();
  },

  async updateById(
    id: string,
    update: UpdateQuery<IVaccinationReactionDocument>
  ): Promise<IVaccinationReactionDocument | null> {
    return VaccinationReaction.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      update,
      { new: true, runValidators: true }
    ).exec();
  },

  async softDelete(id: string, deletedBy: string): Promise<boolean> {
    const result = await VaccinationReaction.updateOne(
      { _id: id, isDeleted: { $ne: true } },
      { isDeleted: true, deletedAt: new Date().toISOString(), deletedBy }
    ).exec();
    return result.modifiedCount > 0;
  },
};
