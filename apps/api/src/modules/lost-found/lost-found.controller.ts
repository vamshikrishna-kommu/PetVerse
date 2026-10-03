import type { Request, Response } from 'express';
import { lostFoundService } from './lost-found.service';
import { apiResponse } from '../../shared/utils/apiResponse';
import { asyncHandler } from '../../middlewares/error.middleware';

export const lostFoundController = {
  createReport: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const userName = (user as any).name || (user as any).email || 'Pet Parent';
    const report = await lostFoundService.createReport(user.userId, userName, req.body);
    apiResponse.created(res, report);
  }),

  getReports: asyncHandler(async (req: Request, res: Response) => {
    const query = {
      type: req.query.type as 'lost' | 'found' | undefined,
      species: req.query.species as string | undefined,
      breed: req.query.breed as string | undefined,
      city: req.query.city as string | undefined,
      status: req.query.status as string | undefined,
      search: req.query.search as string | undefined,
      lng: req.query.lng ? parseFloat(req.query.lng as string) : undefined,
      lat: req.query.lat ? parseFloat(req.query.lat as string) : undefined,
      maxDistanceKm: req.query.maxDistanceKm ? parseFloat(req.query.maxDistanceKm as string) : undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
    };
    const result = await lostFoundService.getReports(query);
    apiResponse.success(res, result);
  }),

  getReportById: asyncHandler(async (req: Request, res: Response) => {
    const report = await lostFoundService.getReportById(
      req.params.id as string,
      req.user?.userId,
      req.user?.role === 'admin'
    );
    apiResponse.success(res, report);
  }),

  findMatches: asyncHandler(async (req: Request, res: Response) => {
    const matches = await lostFoundService.findMatches(req.params.id as string);
    apiResponse.success(res, matches);
  }),

  sendInquiry: asyncHandler(async (req: Request, res: Response) => {
    const user = req.user!;
    const userName = (user as any).name || (user as any).email || 'Citizen';
    await lostFoundService.sendInquiry(
      req.params.id as string,
      user.userId,
      userName,
      req.body.message,
      req.body.contactInfo
    );
    apiResponse.success(res, { message: 'Inquiry sent successfully to the reporter' });
  }),

  resolveReport: asyncHandler(async (req: Request, res: Response) => {
    const report = await lostFoundService.resolveReport(
      req.params.id as string,
      req.user!.userId,
      req.user!.role === 'admin'
    );
    apiResponse.success(res, report);
  }),

  moderateReport: asyncHandler(async (req: Request, res: Response) => {
    const report = await lostFoundService.moderateReport(
      req.params.id as string,
      req.body.moderationStatus
    );
    apiResponse.success(res, report);
  }),
};
