import { NotificationModel } from '../models/notification.model';
import type { INotification } from '@petverse/shared-types';

export const notificationRepository = {
  async findByUserId(userId: string, limit = 50, skip = 0): Promise<INotification[]> {
    return NotificationModel.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  },

  async findUnreadByUserId(userId: string): Promise<INotification[]> {
    return NotificationModel.find({ userId, isRead: false })
      .sort({ createdAt: -1 })
      .exec();
  },

  async countUnread(userId: string): Promise<number> {
    return NotificationModel.countDocuments({ userId, isRead: false }).exec();
  },

  async create(data: Partial<INotification>): Promise<INotification> {
    return new NotificationModel(data).save();
  },

  async markAsRead(id: string, userId: string): Promise<INotification | null> {
    return NotificationModel.findOneAndUpdate(
      { _id: id, userId },
      { $set: { isRead: true, readAt: new Date().toISOString() } },
      { new: true }
    ).exec();
  },

  async markAllAsRead(userId: string): Promise<boolean> {
    const res = await NotificationModel.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true, readAt: new Date().toISOString() } }
    ).exec();
    return res.modifiedCount > 0;
  },
  
  async updateDeliveryStatus(
    id: string,
    channel: string,
    status: string,
    error?: string,
    extra?: { retryCount?: number; deadLetterReason?: string; nextRetryAt?: string }
  ): Promise<INotification | null> {
    const updatePayload: any = { 
      'deliveries.$.status': status 
    };
    if (error !== undefined) updatePayload['deliveries.$.error'] = error;
    if (status === 'sent') updatePayload['deliveries.$.sentAt'] = new Date().toISOString();
    if (status === 'delivered') updatePayload['deliveries.$.deliveredAt'] = new Date().toISOString();
    if (extra?.retryCount !== undefined) updatePayload['deliveries.$.retryCount'] = extra.retryCount;
    if (extra?.deadLetterReason !== undefined) updatePayload['deliveries.$.deadLetterReason'] = extra.deadLetterReason;
    if (extra?.nextRetryAt !== undefined) updatePayload['deliveries.$.nextRetryAt'] = extra.nextRetryAt;

    const setPayload: any = { ...updatePayload };
    if (status === 'dead_letter') {
      setPayload.isDeadLetter = true;
    }

    return NotificationModel.findOneAndUpdate(
      { _id: id, 'deliveries.channel': channel },
      { $set: setPayload },
      { new: true }
    ).exec();
  },

  async findDeadLetters(limit = 50, skip = 0): Promise<INotification[]> {
    return NotificationModel.find({
      $or: [{ isDeadLetter: true }, { 'deliveries.status': 'dead_letter' }],
    })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  },

  async countDeadLetters(): Promise<number> {
    return NotificationModel.countDocuments({
      $or: [{ isDeadLetter: true }, { 'deliveries.status': 'dead_letter' }],
    }).exec();
  },

  async findById(id: string): Promise<INotification | null> {
    return NotificationModel.findById(id).exec();
  },
};
