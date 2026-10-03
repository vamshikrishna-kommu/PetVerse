import { IEvent, DomainEventType } from '@petverse/shared-types';
import { automationRuleRepository } from '../repositories/rule.repository';
import { eventBus } from '../../events/services/event-bus.service';
import { notificationService } from '../../notifications/services/notification.service';
import { logger } from '../../../shared/utils/logger';

export class AutomationService {
  
  public init() {
    // Subscribe to ALL domain events to evaluate automation rules.
    // In a real message broker like RabbitMQ, this would be a topic subscription (e.g. '*.*')
    Object.values(DomainEventType).forEach((eventType) => {
      eventBus.subscribe(eventType as DomainEventType, this.evaluateRules.bind(this));
    });
    logger.info('AutomationService initialized: Subscribed to all domain events.');
  }

  private async evaluateRules(event: IEvent<any>) {
    try {
      const activeRules = await automationRuleRepository.findActiveByTrigger(event.eventType);
      
      if (!activeRules.length) {
        return;
      }

      for (const rule of activeRules) {
        // 1. Evaluate Conditions (Very basic equality check for now)
        // A production rule engine would use something like JSONLogic here.
        let conditionMet = true;
        if (rule.conditions && Object.keys(rule.conditions).length > 0) {
          for (const [key, expectedValue] of Object.entries(rule.conditions)) {
            if (event.payload[key] !== expectedValue) {
              conditionMet = false;
              break;
            }
          }
        }

        // 2. Execute Actions if condition met
        if (conditionMet) {
          logger.info(`Rule [${rule.name}] triggered by event [${event.eventId}]`);
          await this.executeActions(rule.actions, event);
        }
      }
    } catch (error: any) {
      logger.error(`Automation Engine Error on event ${event.eventId}:`, error);
    }
  }

  private async executeActions(actions: any[], event: IEvent<any>) {
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'send_notification': {
            logger.info(`[Action: send_notification] -> ${JSON.stringify(action.config)}`);
            const targetUserId = event.payload?.userId || action.config?.userId;
            if (targetUserId) {
              await notificationService.dispatch(
                targetUserId,
                action.config?.title || 'System Notification',
                action.config?.body || action.config?.message || 'An automated event occurred.',
                action.config?.type || 'system',
                action.config?.priority || 'medium',
                action.config?.channels || ['in-app'],
                { eventId: event.eventId, eventType: event.eventType }
              );
            } else {
              logger.warn(`[Action: send_notification] Skipped: No target userId in event payload or action config.`);
            }
            break;
          }
          case 'trigger_workflow':
            logger.info(`[Action: trigger_workflow] -> WorkflowId: ${action.config.workflowId}`);
            // Instantiate workflow (future)
            break;
          default:
            logger.warn(`Unknown automation action type: ${action.type}`);
        }
      } catch (e) {
        logger.error(`Error executing action ${action.type}`, e);
      }
    }
  }
}

export const automationService = new AutomationService();
