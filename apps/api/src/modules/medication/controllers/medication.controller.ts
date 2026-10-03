import type { Request, Response } from 'express';
import { medicationRepository, medicationCategoryRepository } from '../repositories';
import { apiResponse } from '../../../shared/utils/apiResponse';
import { asyncHandler } from '../../../middlewares/error.middleware';
import { NotFoundError } from '../../../shared/errors/AppError';

export const medicationController = {
  // ─── Categories ───────────────────────────────────────────────
  getCategories: asyncHandler(async (req: Request, res: Response) => {
    const categories = await medicationCategoryRepository.findAll();
    apiResponse.success(res, categories);
  }),
  
  createCategory: asyncHandler(async (req: Request, res: Response) => {
    const category = await medicationCategoryRepository.create({
      ...req.body,
      createdBy: req.user!.userId
    });
    apiResponse.created(res, category);
  }),

  // ─── Medications ──────────────────────────────────────────────
  getMedications: asyncHandler(async (req: Request, res: Response) => {
    const medications = await medicationRepository.findAllActive();
    apiResponse.success(res, medications);
  }),

  searchMedications: asyncHandler(async (req: Request, res: Response) => {
    const q = req.query.q as string;
    if (!q) return apiResponse.success(res, []);
    const medications = await medicationRepository.search(q);
    apiResponse.success(res, medications);
  }),

  getMedicationById: asyncHandler(async (req: Request, res: Response) => {
    const medication = await medicationRepository.findById(req.params.id as string);
    if (!medication) throw new NotFoundError('Medication');
    apiResponse.success(res, medication);
  }),

  createMedication: asyncHandler(async (req: Request, res: Response) => {
    const medication = await medicationRepository.create({
      ...req.body,
      createdBy: req.user!.userId
    });
    apiResponse.created(res, medication);
  })
};
