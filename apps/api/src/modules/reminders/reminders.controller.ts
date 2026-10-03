import type { Request, Response } from 'express';
import { reminderRepository } from './repositories/reminder.repository';
import { apiResponse } from '../../shared/utils/apiResponse';
import { asyncHandler } from '../../middlewares/error.middleware';
import { AppError } from '../../shared/errors/AppError';

export const remindersController = {
  getMyReminders: asyncHandler(async (req: Request, res: Response) => {
    const ownerId = req.user?.userId;
    if (!ownerId) throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');

    const reminders = await reminderRepository.findByOwner(ownerId);
    apiResponse.success(res, reminders);
  }),

  createReminder: asyncHandler(async (req: Request, res: Response) => {
    const ownerId = req.user!.userId;
    const {
      petId,
      type,
      title,
      message,
      frequency,
      cronExpression,
      nextTrigger,
      priority,
      escalation,
    } = req.body;

    if (!title || !petId || !type || !frequency || !nextTrigger) {
      throw new AppError(
        'Missing required fields (petId, type, title, frequency, nextTrigger)',
        400,
        'BAD_REQUEST'
      );
    }

    const reminder = await reminderRepository.create({
      ownerId,
      petId,
      type,
      title,
      message: message || '',
      frequency,
      cronExpression: frequency === 'custom' ? cronExpression : undefined,
      timezone: 'UTC',
      nextTrigger,
      priority: priority || 'medium',
      escalation: escalation || {
        maxRetries: 0,
        retryIntervalMinutes: 60,
        notifySecondaryOwner: false,
        emergencyEscalation: false,
      },
      isActive: true,
      notificationChannels: ['in-app', 'push'],
    });

    apiResponse.created(res, reminder);
  }),

  snoozeReminder: asyncHandler(async (req: Request, res: Response) => {
    const ownerId = req.user!.userId;
    const id = req.params.id as string;
    const { hours = 1 } = req.body; // Snooze for 1 hour by default

    const reminder = await reminderRepository.findByIdAndOwner(id, ownerId);
    if (!reminder) throw new AppError('Reminder not found', 404, 'NOT_FOUND');

    const snoozedUntil = new Date(Date.now() + hours * 3600 * 1000).toISOString();
    const updated = await reminderRepository.snooze(id, snoozedUntil);

    apiResponse.success(res, updated);
  }),

  markCompleted: asyncHandler(async (req: Request, res: Response) => {
    const ownerId = req.user!.userId;
    const id = req.params.id as string;

    const reminder = await reminderRepository.findByIdAndOwner(id, ownerId);
    if (!reminder) throw new AppError('Reminder not found', 404, 'NOT_FOUND');

    await reminderRepository.markCompleted(id);

    apiResponse.success(res, { success: true });
  }),
};
