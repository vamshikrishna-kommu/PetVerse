import type { Request, Response } from 'express';
import { prescriptionRepository, courseRepository, administrationRepository, sideEffectRepository, complianceRepository } from '../repositories';
import { prescriptionService } from '../services/prescription.service';
import { administrationService } from '../services/administration.service';
import { interactionService } from '../services/interaction.service';
import { apiResponse } from '../../../shared/utils/apiResponse';
import { asyncHandler } from '../../../middlewares/error.middleware';
import { AppError } from '../../../shared/errors/AppError';
import type { IPrescriptionItem } from '@petverse/shared-types';

export const prescriptionController = {
  // ─── Prescriptions ───────────────────────────────────────────
  getPrescriptionsByPet: asyncHandler(async (req: Request, res: Response) => {
    const prescriptions = await prescriptionRepository.findByPet(req.params.petId as string);
    apiResponse.success(res, prescriptions);
  }),

  createPrescription: asyncHandler(async (req: Request, res: Response) => {
    const { items, ...prescriptionData } = req.body;
    
    // Evaluate interactions before creating if items exist
    if (items && items.length > 0) {
      // In a real flow, we would fetch existing active meds. For demo, we just pass empty array.
      const interactions = await interactionService.evaluateInteractions(items[0].medicationId, [], []);
      if (interactions.hasSevereWarning && !req.body.overrideWarning) {
        throw new AppError('Severe interaction detected. Override required.', 409, 'INTERACTION_WARNING', interactions.interactions.map(i => ({ field: 'interaction', message: i.description })));
      }
    }

    const prescription = await prescriptionService.createPrescription(
      { ...prescriptionData, petId: req.params.petId as string }, 
      items as Partial<IPrescriptionItem>[], 
      req.user!.userId
    );
    apiResponse.created(res, prescription);
  }),

  // ─── Courses & Compliance ────────────────────────────────────
  getCoursesByPet: asyncHandler(async (req: Request, res: Response) => {
    const courses = await courseRepository.findByPet(req.params.petId as string);
    apiResponse.success(res, courses);
  }),

  getComplianceDetails: asyncHandler(async (req: Request, res: Response) => {
    const compliance = await complianceRepository.findByPetAndCourse(req.params.petId as string, req.params.courseId as string);
    apiResponse.success(res, compliance);
  }),

  // ─── Administration & Side Effects ───────────────────────────
  getAdministrationsByCourse: asyncHandler(async (req: Request, res: Response) => {
    const logs = await administrationRepository.findByCourse(req.params.courseId as string);
    apiResponse.success(res, logs);
  }),

  logAdministration: asyncHandler(async (req: Request, res: Response) => {
    const admin = await administrationService.logAdministration(
      req.params.petId as string, 
      req.params.courseId as string, 
      req.body, 
      req.user!.userId
    );
    apiResponse.created(res, admin);
  }),

  reportSideEffect: asyncHandler(async (req: Request, res: Response) => {
    const effect = await administrationService.reportSideEffect(
      req.params.petId as string, 
      req.body, 
      req.user!.userId
    );
    apiResponse.created(res, effect);
  }),
  
  getSideEffectsByPet: asyncHandler(async (req: Request, res: Response) => {
    const effects = await sideEffectRepository.findByPet(req.params.petId as string);
    apiResponse.success(res, effects);
  })
};
