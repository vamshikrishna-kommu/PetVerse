import { ReminderModel, IReminderDocument } from '../models/reminder.model';
import type { IReminder } from '@petverse/shared-types';

export const reminderRepository = {
  async findDueReminders(currentTime: string, limit = 100): Promise<IReminder[]> {
    return ReminderModel.find({
      isActive: true,
      nextTrigger: { $lte: currentTime },
      $or: [
        { snoozedUntil: null },
        { snoozedUntil: { $lte: currentTime } }
      ]
    }).limit(limit).exec();
  },

  async findByOwner(ownerId: string): Promise<IReminder[]> {
    return ReminderModel.find({ ownerId, isActive: true })
      .sort({ nextTrigger: 1 })
      .exec();
  },

  async findByPet(petId: string): Promise<IReminder[]> {
    return ReminderModel.find({ petId, isActive: true })
      .sort({ nextTrigger: 1 })
      .exec();
  },
  
  async findByIdAndOwner(id: string, ownerId: string): Promise<IReminder | null> {
    return ReminderModel.findOne({ _id: id, ownerId }).exec();
  },

  async create(data: Partial<IReminder>): Promise<IReminder> {
    return new ReminderModel(data).save();
  },

  /**
   * Idempotent create: if a reminder with the same idempotencyKey already exists,
   * return it instead of inserting a duplicate. Safe to call multiple times for the
   * same source event — exactly one reminder will exist.
   */
  async createIfNotExists(data: Partial<IReminderDocument> & { idempotencyKey: string }): Promise<{
    reminder: IReminderDocument;
    created: boolean;
  }> {
    try {
      const reminder = await new ReminderModel(data).save();
      return { reminder, created: true };
    } catch (err: any) {
      // MongoDB duplicate key error (code 11000) on idempotencyKey unique index
      if (err?.code === 11000 && err?.keyPattern?.idempotencyKey) {
        const existing = await ReminderModel.findOne({ idempotencyKey: data.idempotencyKey }).exec();
        if (existing) {
          return { reminder: existing, created: false };
        }
      }
      throw err;
    }
  },

  async updateNextTrigger(id: string, nextTrigger: string): Promise<void> {
    await ReminderModel.updateOne(
      { _id: id },
      { $set: { nextTrigger, snoozedUntil: null } }
    ).exec();
  },

  async incrementMissedCount(id: string, nextTrigger: string): Promise<void> {
    await ReminderModel.updateOne(
      { _id: id },
      { 
        $inc: { missedCount: 1 },
        $set: { nextTrigger, snoozedUntil: null }
      }
    ).exec();
  },

  async markCompleted(id: string, nextTrigger?: string): Promise<void> {
    const update: any = { $inc: { completedCount: 1 }, snoozedUntil: null };
    if (nextTrigger) {
      update.nextTrigger = nextTrigger;
    } else {
      update.isActive = false; // One-time reminder completed
    }
    
    await ReminderModel.updateOne({ _id: id }, { $set: update }).exec();
  },

  async snooze(id: string, snoozedUntil: string): Promise<IReminder | null> {
    return ReminderModel.findOneAndUpdate(
      { _id: id },
      { $set: { snoozedUntil } },
      { new: true }
    ).exec();
  },

  async findLinked(linkedEntityId: string): Promise<IReminder | null> {
    return ReminderModel.findOne({ linkedEntityId }).exec();
  },

  async update(id: string, data: Partial<IReminder>): Promise<IReminder | null> {
    return ReminderModel.findByIdAndUpdate(id, { $set: data }, { new: true }).exec();
  },
};
