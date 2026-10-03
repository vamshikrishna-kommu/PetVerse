import type { Request, Response } from 'express';
import { vaccinationService } from './services/vaccination.service';
import { vaccinationAnalyticsService } from './services/vaccination-analytics.service';
import { vaccineDefinitionRepository } from './repositories/vaccine-definition.repository';
import { vaccinationRecordRepository } from './repositories/vaccination-record.repository';
import { vaccinationReactionRepository } from './repositories/vaccination-reaction.repository';
import { vaccinationCertificateRepository } from './repositories/vaccination-certificate.repository';
import { petService } from '../pets/pet.service';
import { NotFoundError } from '../../shared/errors/AppError';
import { apiResponse } from '../../shared/utils/apiResponse';
import { asyncHandler } from '../../middlewares/error.middleware';

export class VaccinationController {
  
  // ==========================================
  // Schedule Engine
  // ==========================================
  getSchedule = asyncHandler(async (req: Request, res: Response) => {
    const { petId } = req.params;
    const userId = req.user!.userId;
    const isAdmin = req.user?.role === 'admin';

    // Verify ownership
    await petService.getPetById(petId as string, userId, isAdmin);

    const { species, dob } = req.query;
    const schedule = await vaccinationService.getSchedule(petId as string, species as string, dob as string);
    apiResponse.success(res, schedule);
  });

  // ==========================================
  // Analytics
  // ==========================================
  getAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const { petId } = req.params;
    const userId = req.user!.userId;
    const isAdmin = req.user?.role === 'admin';

    await petService.getPetById(petId as string, userId, isAdmin);

    const analytics = await vaccinationAnalyticsService.getPetAnalytics(petId as string);
    apiResponse.success(res, analytics);
  });

  // ==========================================
  // Vaccine Definitions
  // ==========================================
  getDefinitions = asyncHandler(async (req: Request, res: Response) => {
    const { species } = req.query;
    let definitions;
    if (species) {
      definitions = await vaccineDefinitionRepository.findBySpecies(species as string);
    } else {
      definitions = await vaccineDefinitionRepository.findAllActive();
    }
    apiResponse.success(res, definitions);
  });
  
  createDefinition = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    const data = { ...req.body, createdBy: userId };
    const def = await vaccineDefinitionRepository.create(data);
    apiResponse.created(res, def);
  });

  // ==========================================
  // Records
  // ==========================================
  getRecords = asyncHandler(async (req: Request, res: Response) => {
    const { petId } = req.params;
    const userId = req.user!.userId;
    const isAdmin = req.user?.role === 'admin';

    await petService.getPetById(petId as string, userId, isAdmin);

    const records = await vaccinationRecordRepository.findByPet(petId as string);
    apiResponse.success(res, records);
  });

  recordVaccination = asyncHandler(async (req: Request, res: Response) => {
    const { petId } = req.params;
    const userId = req.user!.userId;
    const isAdmin = req.user?.role === 'admin';

    await petService.getPetById(petId as string, userId, isAdmin);

    const record = await vaccinationService.recordVaccination(petId as string, userId, req.body);
    apiResponse.created(res, record);
  });

  deleteRecord = asyncHandler(async (req: Request, res: Response) => {
    const { petId, recordId } = req.params;
    const userId = req.user!.userId;
    const isAdmin = req.user?.role === 'admin';

    // Verify the requesting user owns the pet before deleting any of its records
    await petService.getPetById(petId as string, userId, isAdmin);

    const deleted = await vaccinationRecordRepository.softDelete(recordId as string, userId, isAdmin);
    if (!deleted) {
      throw new NotFoundError('Vaccination record');
    }
    apiResponse.success(res, null);
  });

  // ==========================================
  // Reactions
  // ==========================================
  getReactions = asyncHandler(async (req: Request, res: Response) => {
    const { petId } = req.params;
    const userId = req.user!.userId;
    const isAdmin = req.user?.role === 'admin';

    await petService.getPetById(petId as string, userId, isAdmin);

    const reactions = await vaccinationReactionRepository.findByPet(petId as string);
    apiResponse.success(res, reactions);
  });

  recordReaction = asyncHandler(async (req: Request, res: Response) => {
    const { petId } = req.params;
    const userId = req.user!.userId;
    const isAdmin = req.user?.role === 'admin';

    await petService.getPetById(petId as string, userId, isAdmin);

    const reaction = await vaccinationService.recordReaction(petId as string, userId, req.body);
    apiResponse.created(res, reaction);
  });

  // ==========================================
  // Certificates
  // ==========================================
  getCertificates = asyncHandler(async (req: Request, res: Response) => {
    const { petId } = req.params;
    const userId = req.user!.userId;
    const isAdmin = req.user?.role === 'admin';

    await petService.getPetById(petId as string, userId, isAdmin);

    const certs = await vaccinationCertificateRepository.findByPet(petId as string);
    apiResponse.success(res, certs);
  });

  createCertificate = asyncHandler(async (req: Request, res: Response) => {
    const { petId } = req.params;
    const userId = req.user!.userId;
    const isAdmin = req.user?.role === 'admin';

    await petService.getPetById(petId as string, userId, isAdmin);

    const data = { ...req.body, petId: petId as string, createdBy: userId, status: 'active' };
    const cert = await vaccinationCertificateRepository.create(data);
    apiResponse.created(res, cert);
  });
}

export const vaccinationController = new VaccinationController();
