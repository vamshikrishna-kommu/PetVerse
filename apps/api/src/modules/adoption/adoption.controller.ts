import type { Request, Response } from 'express';
import { adoptionService } from './adoption.service';
import { apiResponse } from '../../shared/utils/apiResponse';
import { asyncHandler } from '../../middlewares/error.middleware';

export const adoptionController = {
  getListings: asyncHandler(async (req: Request, res: Response) => {
    const result = await adoptionService.getListings(req.query as any);
    apiResponse.success(res, result);
  }),

  getListingById: asyncHandler(async (req: Request, res: Response) => {
    const listing = await adoptionService.getListingById(req.params.id as string);
    apiResponse.success(res, listing);
  }),

  createListing: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const listing = await adoptionService.createListing(userId, req.body);
    apiResponse.created(res, listing);
  }),

  updateListing: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const isAdmin = req.user?.role === 'admin';
    const listing = await adoptionService.updateListing(userId, req.params.id as string, req.body, isAdmin);
    apiResponse.success(res, listing);
  }),

  deleteListing: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const isAdmin = req.user?.role === 'admin';
    await adoptionService.deleteListing(userId, req.params.id as string, isAdmin);
    apiResponse.noContent(res);
  }),

  submitApplication: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const application = await adoptionService.submitApplication(userId, req.params.id as string, req.body);
    apiResponse.created(res, application);
  }),

  getMyApplications: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const applications = await adoptionService.getMyApplications(userId);
    apiResponse.success(res, applications);
  }),

  getListingApplications: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const isAdmin = req.user?.role === 'admin';
    const applications = await adoptionService.getListingApplications(userId, req.params.id as string, isAdmin);
    apiResponse.success(res, applications);
  }),

  updateApplicationStatus: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const isAdmin = req.user?.role === 'admin';
    const { status, reviewNotes } = req.body;
    const application = await adoptionService.updateApplicationStatus(userId, req.params.id as string, status, reviewNotes, isAdmin);
    apiResponse.success(res, application);
  }),
};
