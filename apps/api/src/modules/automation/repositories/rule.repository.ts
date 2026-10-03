import { AutomationRuleModel } from '../models/rule.model';
import type { IAutomationRule, DomainEventType } from '@petverse/shared-types';

export const automationRuleRepository = {
  async findActiveByTrigger(eventType: DomainEventType): Promise<IAutomationRule[]> {
    return AutomationRuleModel.find({ 
      triggerEvent: eventType,
      isEnabled: true,
      isDeleted: { $ne: true }
    }).sort({ priority: -1 }).exec(); // Higher priority first
  },

  async findAll(): Promise<IAutomationRule[]> {
    return AutomationRuleModel.find({ isDeleted: { $ne: true } }).exec();
  },

  async create(data: Partial<IAutomationRule>): Promise<IAutomationRule> {
    return new AutomationRuleModel(data).save();
  },

  async updateById(id: string, update: Partial<IAutomationRule>): Promise<IAutomationRule | null> {
    return AutomationRuleModel.findOneAndUpdate(
      { _id: id, isDeleted: { $ne: true } },
      { $set: update },
      { new: true }
    ).exec();
  },

  async delete(id: string, deletedBy: string): Promise<boolean> {
    const res = await AutomationRuleModel.updateOne(
      { _id: id },
      { $set: { isDeleted: true, deletedAt: new Date().toISOString(), deletedBy } }
    ).exec();
    return res.modifiedCount > 0;
  }
};
