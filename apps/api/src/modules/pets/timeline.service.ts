import { TimelineEventModel } from './timeline.model';
import type { IPetTimelineEvent, TimelineEventType } from '@petverse/shared-types';

export class TimelineService {
  /**
   * Create a new timeline event for a pet
   */
  static async addEvent(data: {
    petId: string;
    type: TimelineEventType;
    title: string;
    description?: string;
    date?: string;
    metadata?: Record<string, any>;
  }): Promise<IPetTimelineEvent> {
    const event = await TimelineEventModel.create({
      ...data,
      date: data.date ?? new Date().toISOString(),
    });
    return event.toJSON() as unknown as IPetTimelineEvent;
  }

  /**
   * Get all timeline events for a pet sorted by date descending
   */
  static async getEventsByPet(petId: string): Promise<IPetTimelineEvent[]> {
    const events = await TimelineEventModel.find({ petId })
      .sort({ date: -1, createdAt: -1 })
      .exec();
      
    return events.map(e => e.toJSON() as unknown as IPetTimelineEvent);
  }

  /**
   * Delete a specific event
   */
  static async deleteEvent(eventId: string): Promise<void> {
    await TimelineEventModel.findByIdAndDelete(eventId);
  }

  /**
   * Delete all events for a pet (useful when a pet is deleted)
   */
  static async deleteAllEventsForPet(petId: string): Promise<void> {
    await TimelineEventModel.deleteMany({ petId });
  }
}
