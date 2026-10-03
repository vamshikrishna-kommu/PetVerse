import type { Request, Response } from 'express';
import { expenseService } from './expense.service';
import { apiResponse } from '../../shared/utils/apiResponse';
import { asyncHandler } from '../../middlewares/error.middleware';

export const expenseController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const result = await expenseService.createExpense(userId, req.body);
    apiResponse.created(res, result);
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const result = await expenseService.getExpenses(userId, req.query as any);
    apiResponse.success(res, result);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const result = await expenseService.getExpenseById(userId, req.params.id as string);
    apiResponse.success(res, result);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const result = await expenseService.updateExpense(userId, req.params.id as string, req.body);
    apiResponse.success(res, result);
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    await expenseService.deleteExpense(userId, req.params.id as string);
    apiResponse.noContent(res);
  }),

  analytics: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const year = req.query.year ? parseInt(req.query.year as string, 10) : undefined;
    const result = await expenseService.getExpenseAnalytics(userId, year);
    apiResponse.success(res, result);
  }),

  exportCsv: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const csvData = await expenseService.exportExpensesCsv(userId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=petverse_expenses_${Date.now()}.csv`);
    res.status(200).send(csvData);
  }),
};
