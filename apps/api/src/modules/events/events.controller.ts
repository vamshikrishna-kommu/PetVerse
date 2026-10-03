import { Request, Response, NextFunction } from 'express';
import { eventRepository } from './repositories/event.repository';
import { apiResponse } from '../../shared/utils/apiResponse';
import { AppError } from '../../shared/errors/AppError';
import { EventStatus, DomainEventType } from '@petverse/shared-types';
import { eventBus } from './services/event-bus.service';

export const eventsController = {
  // Get all events for a specific aggregate (e.g. a pet's event history)
  async getByAggregate(req: Request, res: Response, next: NextFunction) {
    try {
      const aggregateId = req.params.aggregateId as string;
      const events = await eventRepository.findByAggregate(aggregateId);
      apiResponse.success(res, events);
    } catch (error) {
      next(error);
    }
  },

  // Get failed events for DLQ processing
  async getFailedEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const events = await eventRepository.findFailedEvents();
      apiResponse.success(res, events);
    } catch (error) {
      next(error);
    }
  },

  // Manual event dispatch (Admin tool / testing)
  async dispatchEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const { aggregateId, aggregateType, eventType, payload } = req.body;
      
      if (!aggregateId || !aggregateType || !eventType || !payload) {
        throw new AppError('Missing required fields', 400, 'VALIDATION_ERROR', [{ field: 'body', message: 'Missing required fields' }]);
      }

      const event = await eventBus.publish(
        aggregateId,
        aggregateType,
        eventType as DomainEventType,
        payload,
        {},
        req.user?.userId || 'admin-api'
      );

      apiResponse.created(res, event);
    } catch (error) {
      next(error);
    }
  }
};
