import type { Request, Response } from 'express';
import { appointmentService } from '../services/appointment.service';
import { apiResponse } from '../../../shared/utils/apiResponse';
import { asyncHandler } from '../../../middlewares/error.middleware';

export const appointmentController = {
  getAvailableSlots: asyncHandler(async (req: Request, res: Response) => {
    const clinicId = req.query.clinicId as string;
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];
    const slots = await appointmentService.getAvailableSlots(clinicId, date);
    apiResponse.success(res, slots);
  }),

  bookAppointment: asyncHandler(async (req: Request, res: Response) => {
    const result = await appointmentService.bookAppointment(req.user!.userId, req.body);
    apiResponse.created(res, result);
  }),

  getUserAppointments: asyncHandler(async (req: Request, res: Response) => {
    const query = {
      status: req.query.status as string,
      petId: req.query.petId as string,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 100,
    };
    const result = await appointmentService.getUserAppointments(req.user!.userId, query);
    apiResponse.success(res, result);
  }),

  getAppointmentById: asyncHandler(async (req: Request, res: Response) => {
    const result = await appointmentService.getAppointmentById(
      req.params.id as string,
      req.user!.userId,
      req.user!.role === 'admin'
    );
    apiResponse.success(res, result);
  }),

  cancelAppointment: asyncHandler(async (req: Request, res: Response) => {
    const result = await appointmentService.cancelAppointment(
      req.params.id as string,
      req.user!.userId,
      req.body?.reason,
      req.user!.role === 'admin'
    );
    apiResponse.success(res, result);
  }),

  completeAppointment: asyncHandler(async (req: Request, res: Response) => {
    const result = await appointmentService.completeAppointment(
      req.params.id as string,
      req.user!.userId,
      req.user!.role === 'admin'
    );
    apiResponse.success(res, result);
  }),

  rescheduleAppointment: asyncHandler(async (req: Request, res: Response) => {
    const result = await appointmentService.rescheduleAppointment(
      req.params.id as string,
      req.user!.userId,
      req.body,
      req.user!.role === 'admin'
    );
    apiResponse.success(res, result);
  }),

  updateClinicSchedule: asyncHandler(async (req: Request, res: Response) => {
    const result = await appointmentService.updateClinicSchedule(
      req.params.id as string,
      req.user!.userId,
      req.body,
      req.user!.role === 'admin'
    );
    apiResponse.success(res, result);
  }),
};
