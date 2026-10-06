import type { Request, Response } from 'express';
import { nearbyService } from '../services/nearby.service';
import { apiResponse } from '../../../shared/utils/apiResponse';
import { asyncHandler } from '../../../middlewares/error.middleware';

export const nearbyController = {
  getNearbyServices: asyncHandler(async (req: Request, res: Response) => {
    const query = {
      lat: req.query.lat ? parseFloat(req.query.lat as string) : undefined,
      lng: req.query.lng ? parseFloat(req.query.lng as string) : undefined,
      radiusKm: req.query.radiusKm ? parseFloat(req.query.radiusKm as string) : undefined,
      type: req.query.type as string,
      search: req.query.search as string,
      locality: req.query.locality as string,
      emergencyOnly:
        req.query.emergencyOnly === 'true' ||
        req.query.emergencyOnly === '1' ||
        req.query.type === 'emergency_hospital',
      openNow: req.query.openNow === 'true' || req.query.openNow === '1',
      minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
    };

    const result = await nearbyService.getNearbyServices(query);
    apiResponse.success(res, result.data, 200, {
      total: result.total,
      page: query.page,
      limit: query.limit,
    });
  }),

  getClinicById: asyncHandler(async (req: Request, res: Response) => {
    const result = await nearbyService.getClinicById(req.params.id as string);
    apiResponse.success(res, result);
  }),

  getClinicReviews: asyncHandler(async (req: Request, res: Response) => {
    const result = await nearbyService.getClinicReviews(req.params.id as string);
    apiResponse.success(res, result);
  }),

  addReview: asyncHandler(async (req: Request, res: Response) => {
    const result = await nearbyService.addReview(
      req.params.id as string,
      req.user!.userId,
      req.body
    );
    apiResponse.created(res, result);
  }),
};
