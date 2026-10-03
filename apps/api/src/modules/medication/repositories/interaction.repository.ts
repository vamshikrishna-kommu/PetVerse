import { MedicationInteractionModel, MedicationSideEffectModel, MedicationContraindicationModel, type IMedicationInteractionDocument, type IMedicationSideEffectDocument, type IMedicationContraindicationDocument } from '../models/interaction.model';

export const interactionRepository = {
  async findInteractions(medicationIds: string[]): Promise<IMedicationInteractionDocument[]> {
    return MedicationInteractionModel.find({
      primaryMedicationId: { $in: medicationIds },
      interactingEntityId: { $in: medicationIds },
      isDeleted: { $ne: true }
    }).exec();
  },
  
  async create(data: Partial<IMedicationInteractionDocument>): Promise<IMedicationInteractionDocument> {
    return new MedicationInteractionModel(data).save();
  }
};

export const sideEffectRepository = {
  async findByPet(petId: string): Promise<IMedicationSideEffectDocument[]> {
    return MedicationSideEffectModel.find({ petId, isDeleted: { $ne: true } })
      .sort({ onsetDateTime: -1 }).exec();
  },
  
  async create(data: Partial<IMedicationSideEffectDocument>): Promise<IMedicationSideEffectDocument> {
    return new MedicationSideEffectModel(data).save();
  }
};

export const contraindicationRepository = {
  async check(medicationId: string, conditionNames: string[]): Promise<IMedicationContraindicationDocument[]> {
    return MedicationContraindicationModel.find({
      medicationId,
      conditionName: { $in: conditionNames },
      isDeleted: { $ne: true }
    }).exec();
  }
};
