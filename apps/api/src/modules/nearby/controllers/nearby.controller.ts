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
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
    };

    const result = await nearbyService.getNearbyServices(query);
    apiResponse.success(res, result.data);
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
