import type { Request, Response } from 'express';
import { growthService } from '../services/growth.service';
import { apiResponse } from '../../../shared/utils/apiResponse';
import { asyncHandler } from '../../../middlewares/error.middleware';

export const growthController = {
  createLog: asyncHandler(async (req: Request, res: Response) => {
    const result = await growthService.addGrowthLog(
      req.params.petId as string,
      req.user!.userId,
      req.body,
      req.user!.role === 'admin'
    );
    apiResponse.created(res, result);
  }),

  getLogs: asyncHandler(async (req: Request, res: Response) => {
    const query = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 100,
    };
    const result = await growthService.getGrowthLogs(
      req.params.petId as string,
      req.user!.userId,
      query,
      req.user!.role === 'admin'
    );
    apiResponse.success(res, result);
  }),

  getAnalytics: asyncHandler(async (req: Request, res: Response) => {
    const result = await growthService.getGrowthAnalytics(
      req.params.petId as string,
      req.user!.userId,
      req.user!.role === 'admin'
    );
    apiResponse.success(res, result);
  }),

  updateLog: asyncHandler(async (req: Request, res: Response) => {
    const result = await growthService.updateGrowthLog(
      req.params.petId as string,
      req.params.growthId as string,
      req.user!.userId,
      req.body,
      req.user!.role === 'admin'
    );
    apiResponse.success(res, result);
  }),

  deleteLog: asyncHandler(async (req: Request, res: Response) => {
    await growthService.deleteGrowthLog(
      req.params.petId as string,
      req.params.growthId as string,
      req.user!.userId,
      req.user!.role === 'admin'
    );
    apiResponse.noContent(res);
  }),
};
