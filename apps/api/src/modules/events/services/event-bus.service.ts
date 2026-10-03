import { EventEmitter } from 'events';
import mongoose from 'mongoose';
import { eventRepository } from '../repositories/event.repository';
import { IEvent, IEventDocument, DomainEventType, EventStatus } from '@petverse/shared-types';
import { logger } from '../../../shared/utils/logger'; // Assuming logger exists or use console

type EventHandler<T = any> = (event: IEvent<T>) => Promise<void> | void;

class EventBusService {
  private bus = new EventEmitter();
  
  constructor() {
    // Increase limit for enterprise usage
    this.bus.setMaxListeners(100);
  }

  /**
   * Subscribe to a specific domain event.
   */
  public subscribe<T = any>(eventType: DomainEventType, handler: EventHandler<T>): void {
    this.bus.on(eventType, async (event: IEvent<T>) => {
      try {
        // Execute handler asynchronously
        await handler(event);
      } catch (error: any) {
        logger.error(`Error in event handler for ${eventType}:`, error);
        // Error isolation: We catch the error so it doesn't crash the event bus
        // In a real system, we might push this to a DLQ (Dead Letter Queue) or mark the execution as failed.
      }
    });
  }

  /**
   * Unsubscribe a handler from a domain event.
   */
  public unsubscribe<T = any>(eventType: DomainEventType, handler: EventHandler<T>): void {
    this.bus.off(eventType, handler);
  }

  /**
   * Publish an event to the Event Store and trigger all subscribers.
   */
  public async publish<T = any>(
    aggregateId: string,
    aggregateType: string,
    eventType: DomainEventType,
    payload: T,
    metadataOverrides: Partial<IEvent['metadata']> = {},
    createdBy: string = 'system'
  ): Promise<IEventDocument> {
    
    const timestamp = new Date().toISOString();
    
    const metadata = {
      version: 1,
      timestamp,
      replayFlag: false,
      source: 'backend-api',
      ...metadataOverrides,
    };

    // 1. Persist to Event Store
    const eventDoc = await eventRepository.create({
      aggregateId,
      aggregateType,
      eventType,
      payload,
      metadata,
      status: EventStatus.Pending, // Will be processed async
      createdBy,
    } as any);

    const eventPayload: IEvent<T> = {
      eventId: eventDoc._id.toString(),
      aggregateId,
      aggregateType,
      eventType,
      payload,
      metadata,
    };

    // 2. Dispatch memory event asynchronously to isolate from the main transaction
    setImmediate(async () => {
      if (mongoose.connection.readyState !== 1) return;
      try {
        // Emitting triggers all handlers registered to this eventType
        this.bus.emit(eventType, eventPayload);
        
        // 3. If no errors crashed the node process, mark as processed.
        // Handlers failing will be caught by their own try/catch in subscribe()
        if (mongoose.connection.readyState === 1) {
          await eventRepository.markAsProcessed(eventDoc._id.toString());
        }
      } catch (err: any) {
        logger.error(`Fatal error publishing event ${eventDoc._id}:`, err);
        try {
          if (mongoose.connection.readyState === 1) {
            await eventRepository.markAsFailed(eventDoc._id.toString(), err.message);
          }
        } catch {
          // Ignore secondary failures when DB is tearing down
        }
      }
    });

    return eventDoc;
  }
}

export const eventBus = new EventBusService();
