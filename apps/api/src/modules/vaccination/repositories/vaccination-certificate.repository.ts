import type { UpdateQuery } from 'mongoose';
import { VaccinationCertificate, type IVaccinationCertificateDocument } from '../models/vaccination-certificate.model';

export const vaccinationCertificateRepository = {
  async findById(id: string): Promise<IVaccinationCertificateDocument | null> {
    return VaccinationCertificate.findOne({ _id: id, isDeleted: { $ne: true } }).exec();
  },

  async findByPet(petId: string): Promise<IVaccinationCertificateDocument[]> {
    return VaccinationCertificate.find({ petId, isDeleted: { $ne: true } })
      .sort({ issuedDate: -1 })
      .exec();
  },

  async create(data: Partial<IVaccinationCertificateDocument>): Promise<IVaccinationCertificateDocument> {
    const cert = new VaccinationCertificate(data);
    return cert.save();
  },

  async updateById(
    id: string,
    update: UpdateQuery<IVaccinationCertificateDocument>
  ): Promise<IVaccinationCertificateDocument | null> {
    return VaccinationCertificate.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      update,
      { new: true, runValidators: true }
    ).exec();
  },

  async revoke(id: string, deletedBy: string): Promise<boolean> {
    const result = await VaccinationCertificate.updateOne(
      { _id: id, isDeleted: { $ne: true } },
      { status: 'revoked', updatedBy: deletedBy }
    ).exec();
    return result.modifiedCount > 0;
  },
};
