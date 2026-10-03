import type { Request, Response } from 'express';
import { healthService } from './health.service';
import { apiResponse } from '../../shared/utils/apiResponse';
import { asyncHandler } from '../../middlewares/error.middleware';

export const healthController = {
  // ─── Dashboard & Analytics ───────────────────────────────────
  getDashboard: asyncHandler(async (req: Request, res: Response) => {
    const result = await healthService.getHealthDashboard(
      req.params.petId as string,
      req.user!.userId,
      req.user!.role === 'admin'
    );
    apiResponse.success(res, result);
  }),

  getAnalytics: asyncHandler(async (req: Request, res: Response) => {
    const periodDays = req.query.periodDays ? parseInt(req.query.periodDays as string, 10) : 365;
    const result = await healthService.getHealthAnalytics(
      req.params.petId as string,
      req.user!.userId,
      req.user!.role === 'admin',
      periodDays
    );
    apiResponse.success(res, result);
  }),

  getSummary: asyncHandler(async (req: Request, res: Response) => {
    const result = await healthService.getHealthSummary(
      req.params.petId as string,
      req.user!.userId,
      req.user!.role === 'admin'
    );
    apiResponse.success(res, result);
  }),

  // ─── Medical Records ─────────────────────────────────────────
  getVisits: asyncHandler(async (req: Request, res: Response) => {
    const query = {
      status: req.query.status as string,
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
    };
    const result = await healthService.getVisits(req.params.petId as string, req.user!.userId, req.user!.role === 'admin', query);
    apiResponse.success(res, result.data, 200, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit),
    });
  }),

  getVisitById: asyncHandler(async (req: Request, res: Response) => {
    const result = await healthService.getVisitById(req.params.petId as string, req.params.recordId as string, req.user!.userId, req.user!.role === 'admin');
    apiResponse.success(res, result);
  }),

  createVisit: asyncHandler(async (req: Request, res: Response) => {
    const result = await healthService.createVisit(req.params.petId as string, req.user!.userId, req.user!.role === 'admin', req.body);
    apiResponse.created(res, result);
  }),

  updateVisit: asyncHandler(async (req: Request, res: Response) => {
    const result = await healthService.updateVisit(req.params.petId as string, req.params.recordId as string, req.user!.userId, req.user!.role === 'admin', req.body);
    apiResponse.success(res, result);
  }),

  deleteVisit: asyncHandler(async (req: Request, res: Response) => {
    await healthService.deleteVisit(req.params.petId as string, req.params.recordId as string, req.user!.userId, req.user!.role === 'admin');
    apiResponse.noContent(res);
  }),

  // ─── Vitals ──────────────────────────────────────────────────
  getVitals: asyncHandler(async (req: Request, res: Response) => {
    const query = {
      sinceDate: req.query.sinceDate as string,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 50,
    };
    const result = await healthService.getVitals(req.params.petId as string, req.user!.userId, req.user!.role === 'admin', query);
    apiResponse.success(res, result.data);
  }),

  getLatestVitals: asyncHandler(async (req: Request, res: Response) => {
    const result = await healthService.getLatestVitals(req.params.petId as string, req.user!.userId, req.user!.role === 'admin');
    apiResponse.success(res, result);
  }),

  logVital: asyncHandler(async (req: Request, res: Response) => {
    const result = await healthService.logVital(req.params.petId as string, req.user!.userId, req.user!.role === 'admin', req.body);
    apiResponse.created(res, result);
  }),

  deleteVital: asyncHandler(async (req: Request, res: Response) => {
    await healthService.deleteVital(req.params.petId as string, req.params.vitalId as string, req.user!.userId, req.user!.role === 'admin');
    apiResponse.noContent(res);
  }),

  // ─── Conditions ──────────────────────────────────────────────
  getConditions: asyncHandler(async (req: Request, res: Response) => {
    const result = await healthService.getConditions(req.params.petId as string, req.user!.userId, req.user!.role === 'admin');
    apiResponse.success(res, result);
  }),

  addCondition: asyncHandler(async (req: Request, res: Response) => {
    const result = await healthService.addCondition(req.params.petId as string, req.user!.userId, req.user!.role === 'admin', req.body);
    apiResponse.created(res, result);
  }),

  updateCondition: asyncHandler(async (req: Request, res: Response) => {
    const result = await healthService.updateCondition(req.params.petId as string, req.params.condId as string, req.user!.userId, req.user!.role === 'admin', req.body);
    apiResponse.success(res, result);
  }),

  addProgressNote: asyncHandler(async (req: Request, res: Response) => {
    const result = await healthService.addProgressNote(req.params.petId as string, req.params.condId as string, req.user!.userId, req.user!.role === 'admin', req.body.note as string);
    apiResponse.success(res, result);
  }),

  deleteCondition: asyncHandler(async (req: Request, res: Response) => {
    await healthService.deleteCondition(req.params.petId as string, req.params.condId as string, req.user!.userId, req.user!.role === 'admin');
    apiResponse.noContent(res);
  }),

  // ─── Allergies ───────────────────────────────────────────────
  getAllergies: asyncHandler(async (req: Request, res: Response) => {
    const result = await healthService.getAllergies(req.params.petId as string, req.user!.userId, req.user!.role === 'admin');
    apiResponse.success(res, result);
  }),

  addAllergy: asyncHandler(async (req: Request, res: Response) => {
    const result = await healthService.addAllergy(req.params.petId as string, req.user!.userId, req.user!.role === 'admin', req.body);
    apiResponse.created(res, result);
  }),

  updateAllergy: asyncHandler(async (req: Request, res: Response) => {
    const result = await healthService.updateAllergy(req.params.petId as string, req.params.allergyId as string, req.user!.userId, req.user!.role === 'admin', req.body);
    apiResponse.success(res, result);
  }),

  deleteAllergy: asyncHandler(async (req: Request, res: Response) => {
    await healthService.deleteAllergy(req.params.petId as string, req.params.allergyId as string, req.user!.userId, req.user!.role === 'admin');
    apiResponse.noContent(res);
  }),

  // ─── Lab Reports ─────────────────────────────────────────────
  getLabReports: asyncHandler(async (req: Request, res: Response) => {
    const query = {
      category: req.query.category as string,
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
    };
    const result = await healthService.getLabReports(req.params.petId as string, req.user!.userId, req.user!.role === 'admin', query);
    apiResponse.success(res, result.data, 200, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit),
    });
  }),

  getLabReportById: asyncHandler(async (req: Request, res: Response) => {
    const result = await healthService.getLabReportById(req.params.petId as string, req.params.labId as string, req.user!.userId, req.user!.role === 'admin');
    apiResponse.success(res, result);
  }),

  createLabReport: asyncHandler(async (req: Request, res: Response) => {
    const result = await healthService.createLabReport(req.params.petId as string, req.user!.userId, req.user!.role === 'admin', req.body);
    apiResponse.created(res, result);
  }),

  updateLabReport: asyncHandler(async (req: Request, res: Response) => {
    const result = await healthService.updateLabReport(req.params.petId as string, req.params.labId as string, req.user!.userId, req.user!.role === 'admin', req.body);
    apiResponse.success(res, result);
  }),

  // ─── Imaging Studies ─────────────────────────────────────────
  getImagingStudies: asyncHandler(async (req: Request, res: Response) => {
    const query = {
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 20,
    };
    const result = await healthService.getImagingStudies(req.params.petId as string, req.user!.userId, req.user!.role === 'admin', query);
    apiResponse.success(res, result.data, 200, {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit),
    });
  }),

  getImagingStudyById: asyncHandler(async (req: Request, res: Response) => {
    const result = await healthService.getImagingStudyById(req.params.petId as string, req.params.studyId as string, req.user!.userId, req.user!.role === 'admin');
    apiResponse.success(res, result);
  }),

  createImagingStudy: asyncHandler(async (req: Request, res: Response) => {
    const result = await healthService.createImagingStudy(req.params.petId as string, req.user!.userId, req.user!.role === 'admin', req.body);
    apiResponse.created(res, result);
  }),

  updateImagingStudy: asyncHandler(async (req: Request, res: Response) => {
    const result = await healthService.updateImagingStudy(req.params.petId as string, req.params.studyId as string, req.user!.userId, req.user!.role === 'admin', req.body);
    apiResponse.success(res, result);
  }),

  // ─── Surgeries ───────────────────────────────────────────────
  getSurgeries: asyncHandler(async (req: Request, res: Response) => {
    const result = await healthService.getSurgeries(req.params.petId as string, req.user!.userId, req.user!.role === 'admin');
    apiResponse.success(res, result);
  }),

  createSurgery: asyncHandler(async (req: Request, res: Response) => {
    const result = await healthService.createSurgery(req.params.petId as string, req.user!.userId, req.user!.role === 'admin', req.body);
    apiResponse.created(res, result);
  }),

  updateSurgery: asyncHandler(async (req: Request, res: Response) => {
    const result = await healthService.updateSurgery(req.params.petId as string, req.params.surgeryId as string, req.user!.userId, req.user!.role === 'admin', req.body);
    apiResponse.success(res, result);
  }),

  deleteSurgery: asyncHandler(async (req: Request, res: Response) => {
    await healthService.deleteSurgery(req.params.petId as string, req.params.surgeryId as string, req.user!.userId, req.user!.role === 'admin');
    apiResponse.noContent(res);
  }),
};
