import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { UserModel } from './user.model';
import { userRepository } from './user.repository';
import { PetModel } from '../pets/pet.model';
import { MedicalRecordModel } from '../health/models/medical-record.model';
import { VaccinationRecord } from '../vaccination/models/vaccination-record.model';
import { ReminderModel } from '../reminders/models/reminder.model';
import { AppointmentModel } from '../appointments/models/appointment.model';
import { LostFoundReportModel } from '../lost-found/lost-found.model';
import { NotificationModel } from '../notifications/models/notification.model';
import { uploadUserAvatar } from '../../shared/utils/cloudinaryUploader';
import { apiResponse } from '../../shared/utils/apiResponse';
import { asyncHandler } from '../../middlewares/error.middleware';
import { NotFoundError, AppError } from '../../shared/errors/AppError';
import bcrypt from 'bcryptjs';
import { petService } from '../pets/pet.service';
import { auditService } from '../audit/audit.service';

export const userController = {
  getMe: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) {
      throw new NotFoundError('User not found');
    }
    const user = await userRepository.findById(req.user.userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    apiResponse.success(res, user);
  }),

  /** Update current user's profile information */
  updateMe: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { firstName, lastName, phone, bio } = req.body;

    const updateData: any = {};
    if (firstName) updateData['profile.firstName'] = firstName;
    if (lastName) updateData['profile.lastName'] = lastName;
    if (bio !== undefined) updateData['profile.bio'] = bio;
    if (phone !== undefined) updateData.phone = phone;

    const updatedUser = await userRepository.updateById(userId, updateData);
    if (!updatedUser) {
      throw new NotFoundError('User not found');
    }

    apiResponse.success(res, updatedUser);
  }),

  /** Upload user avatar */
  uploadAvatar: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    if (!req.file) {
      throw new AppError('No image file provided', 400, 'MISSING_FILE');
    }

    const avatarUrl = await uploadUserAvatar(req.file.buffer, userId);
    const updatedUser = await userRepository.updateById(userId, {
      'profile.avatar': avatarUrl,
    });

    apiResponse.success(res, updatedUser);
  }),

  /** Aggregate dashboard stats across all pets owned by the current user */
  getStats: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const userObjId = new mongoose.Types.ObjectId(userId);

    const [petCount, medicalRecordCount, activeVaccinationCount, pendingReminderCount, upcomingAppointmentCount] = await Promise.all([
      PetModel.countDocuments({ ownerId: userObjId, isDeleted: { $ne: true } }),
      MedicalRecordModel.countDocuments({ ownerId: userObjId, isDeleted: { $ne: true } }),
      VaccinationRecord.countDocuments({ ownerId: userObjId, isDeleted: { $ne: true } }),
      ReminderModel.countDocuments({ ownerId: userId, isActive: true }),
      AppointmentModel.countDocuments({ ownerId: userObjId, status: { $in: ['scheduled', 'confirmed'] } }),
    ]);

    apiResponse.success(res, {
      petCount,
      medicalRecordCount,
      activeVaccinationCount,
      pendingReminderCount,
      upcomingAppointmentCount,
    });
  }),

  /** Admin: List registered users with search, role filter, pagination */
  listUsers: asyncHandler(async (req: Request, res: Response) => {
    const { search, role, page = 1, limit = 20 } = req.query;
    const filter: any = {};

    if (role && typeof role === 'string' && role !== 'all') {
      filter.role = role;
    }

    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { email: { $regex: q, $options: 'i' } },
        { 'profile.firstName': { $regex: q, $options: 'i' } },
        { 'profile.lastName': { $regex: q, $options: 'i' } },
      ];
    }

    const result = await userRepository.findAll(filter, Number(page), Number(limit));
    apiResponse.success(res, result);
  }),

  /** Admin: Update user status (active/inactive or change role) */
  toggleUserStatus: asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { isActive, role } = req.body;
    const updateData: any = {};

    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (role && ['pet_owner', 'vet', 'shelter', 'admin'].includes(role)) {
      updateData.role = role;
    }

    const updated = await userRepository.updateById(id, updateData);
    if (!updated) {
      throw new NotFoundError('User not found');
    }

    // Record administrative audit log
    if (req.user) {
      const actor = await userRepository.findById(req.user.userId);
      const actionName =
        typeof isActive === 'boolean'
          ? isActive
            ? 'USER_ACTIVATED'
            : 'USER_DEACTIVATED'
          : 'USER_ROLE_CHANGED';

      await auditService.log({
        actorId: req.user.userId,
        actorEmail: actor?.email || 'admin@petverse.app',
        actorRole: req.user.role,
        action: actionName,
        targetType: 'User',
        targetId: id,
        details: updateData,
        ipAddress: req.ip || (req.headers['x-forwarded-for'] as string),
        userAgent: req.headers['user-agent'] as string,
      }).catch(() => {});
    }

    apiResponse.success(res, updated);
  }),

  /** Admin: Query audit logs */
  getAuditLogs: asyncHandler(async (req: Request, res: Response) => {
    const { action, targetType, actorId, page, limit } = req.query;
    const result = await auditService.getAuditLogs({
      action: action as string,
      targetType: targetType as string,
      actorId: actorId as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    apiResponse.success(res, result);
  }),

  /** Admin: Global platform system statistics */
  getAdminSystemStats: asyncHandler(async (_req: Request, res: Response) => {
    const [
      totalUsers,
      activeUsers,
      totalPets,
      totalLostPets,
      totalAppointments,
      totalReminders,
      totalNotifications,
    ] = await Promise.all([
      UserModel.countDocuments(),
      UserModel.countDocuments({ isActive: true }),
      PetModel.countDocuments({ isDeleted: { $ne: true } }),
      LostFoundReportModel.countDocuments({ reportType: 'lost', status: 'active' }),
      AppointmentModel.countDocuments(),
      ReminderModel.countDocuments({ isActive: true }),
      NotificationModel.countDocuments(),
    ]);

    apiResponse.success(res, {
      totalUsers,
      activeUsers,
      totalPets,
      totalLostPets,
      totalAppointments,
      totalReminders,
      totalNotifications,
      systemStatus: 'healthy',
      uptimeSeconds: Math.floor(process.uptime()),
    });
  }),

  /** Update fine-grained notification/privacy preferences */
  updatePreferences: asyncHandler(async (req: Request, res: Response) => {
    const user = await UserModel.findById(req.user!.userId);
    if (!user) throw new NotFoundError('User');
    user.preferences = {
      ...(user.preferences || {}),
      ...req.body,
    };
    await user.save();
    apiResponse.success(res, user);
  }),

  /** Authenticated change password */
  changePassword: asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      throw new AppError('Current and new password are required', 400, 'MISSING_FIELDS');
    }
    if (newPassword.length < 8) {
      throw new AppError('New password must be at least 8 characters long', 400, 'PASSWORD_TOO_SHORT');
    }

    const user = await UserModel.findById(req.user!.userId).select('+passwordHash');
    if (!user || !user.passwordHash) {
      throw new NotFoundError('User');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Current password is incorrect', 400, 'INVALID_CREDENTIALS');
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    apiResponse.success(res, { message: 'Password updated successfully' });
  }),

  /** Export GDPR account data */
  exportUserData: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const [user, pets, appointments, reminders] = await Promise.all([
      UserModel.findById(userId).lean(),
      PetModel.find({ ownerId: userId }).lean(),
      AppointmentModel.find({ ownerId: userId }).lean(),
      ReminderModel.find({ ownerId: userId }).lean(),
    ]);

    const petIds = pets.map((p) => p._id);
    const [medicalRecords, vaccinations] = await Promise.all([
      MedicalRecordModel.find({ petId: { $in: petIds } }).lean(),
      VaccinationRecord.find({ petId: { $in: petIds } }).lean(),
    ]);

    const exportPackage = {
      exportDate: new Date().toISOString(),
      user: {
        id: user?._id,
        email: user?.email,
        phone: user?.phone,
        profile: user?.profile,
        preferences: user?.preferences,
        createdAt: (user as any)?.createdAt,
      },
      pets,
      health: {
        medicalRecords,
        vaccinations,
      },
      appointments,
      reminders,
    };

    apiResponse.success(res, exportPackage);
  }),

  /** Delete user account and cascade clean all data */
  deleteAccount: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const pets = await PetModel.find({ ownerId: userId });

    for (const pet of pets) {
      try {
        await petService.deletePet(pet._id.toString(), userId, true);
      } catch {
        // Continue cascade delete
      }
    }

    await Promise.all([
      UserModel.findByIdAndDelete(userId),
      AppointmentModel.deleteMany({ ownerId: userId }),
      ReminderModel.deleteMany({ ownerId: userId }),
    ]);

    apiResponse.success(res, { message: 'Account and associated records deleted permanently' });
  }),

  /** Admin: Query all pets platform-wide */
  listAllPets: asyncHandler(async (req: Request, res: Response) => {
    const { species, search, page, limit } = req.query;
    const filter: any = { isDeleted: { $ne: true } };
    if (species && species !== 'all') {
      filter.species = species;
    }
    if (search) {
      filter.$or = [
        { name: new RegExp(search as string, 'i') },
        { breed: new RegExp(search as string, 'i') },
        { microchipId: new RegExp(search as string, 'i') },
      ];
    }

    const p = Number(page) || 1;
    const l = Number(limit) || 20;

    const [pets, total] = await Promise.all([
      PetModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((p - 1) * l)
        .limit(l)
        .lean(),
      PetModel.countDocuments(filter),
    ]);

    apiResponse.success(res, {
      pets,
      total,
      page: p,
      totalPages: Math.ceil(total / l),
    });
  }),
};
