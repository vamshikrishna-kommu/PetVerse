import { EventModel } from '../models/event.model';
import { IEventDocument, EventStatus, DomainEventType } from '@petverse/shared-types';
export const eventRepository = {
  async create(data: Partial<IEventDocument>): Promise<IEventDocument> {
    return new EventModel(data).save();
  },

  async findByAggregate(aggregateId: string): Promise<IEventDocument[]> {
    return EventModel.find({ aggregateId }).sort({ 'metadata.timestamp': 1 }).exec();
  },

  async findPendingEvents(): Promise<IEventDocument[]> {
    return EventModel.find({ status: EventStatus.Pending }).exec();
  },

  async findFailedEvents(): Promise<IEventDocument[]> {
    return EventModel.find({ status: EventStatus.Failed }).exec();
  },

  async markAsProcessed(id: string): Promise<IEventDocument | null> {
    return EventModel.findOneAndUpdate(
      { _id: id },
      { $set: { status: EventStatus.Processed } },
      { new: true }
    ).exec();
  },

  async markAsFailed(id: string, error: string): Promise<IEventDocument | null> {
    return EventModel.findOneAndUpdate(
      { _id: id },
      { $set: { status: EventStatus.Failed, processingError: error } },
      { new: true }
    ).exec();
  }
};
