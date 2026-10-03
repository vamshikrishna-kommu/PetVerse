import { eventBus } from '../../events/services/event-bus.service';
import { DomainEventType, IEvent } from '@petverse/shared-types';
import { notificationService } from '../services/notification.service';
import { logger } from '../../../shared/utils/logger';

export class NotificationSubscriber {
  public init() {
    // Listen to System Notification Requests
    eventBus.subscribe(DomainEventType.NotificationSent, this.handleDirectNotification.bind(this));
    
    // Listen to Reminders Triggering
    eventBus.subscribe(DomainEventType.ReminderTriggered, this.handleReminderTriggered.bind(this));
    
    logger.info('NotificationSubscriber initialized: Listening to Notification and Reminder events.');
  }

  private async handleDirectNotification(event: IEvent<any>) {
    const { userId, title, body, priority, channels, data } = event.payload;
    await notificationService.dispatch(
      userId,
      title,
      body,
      'system',
      priority || 'low',
      channels || ['in-app'],
      data
    );
  }

  private async handleReminderTriggered(event: IEvent<any>) {
    const { ownerId, title, message, priority, notificationChannels, linkedEntityId } = event.payload;
    
    await notificationService.dispatch(
      ownerId,
      title,
      message || title,
      'reminder',
      priority || 'medium',
      notificationChannels && notificationChannels.length > 0 ? notificationChannels : ['in-app', 'push'],
      { reminderId: event.aggregateId, linkedEntityId }
    );
  }
}

export const notificationSubscriber = new NotificationSubscriber();
