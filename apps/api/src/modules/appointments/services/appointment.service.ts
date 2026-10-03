import { AppointmentModel, type IAppointmentDocument } from '../models/appointment.model';
import { ClinicModel } from '../models/clinic.model';
import { petService } from '../../pets/pet.service';
import { reminderRepository } from '../../reminders/repositories/reminder.repository';
import { notificationService } from '../../notifications/services/notification.service';
import { eventBus } from '../../events/services/event-bus.service';
import { TimelineService } from '../../pets/timeline.service';
import { NotFoundError, ForbiddenError, ConflictError, AppError } from '../../../shared/errors/AppError';
import { DomainEventType } from '@petverse/shared-types';
import type { IAppointment, IClinic } from '@petverse/shared-types';
import mongoose from 'mongoose';

export const appointmentService = {
  async getAvailableSlots(clinicId: string, date: string): Promise<string[]> {
    let slotDuration = 30;
    let openTime = '09:00';
    let closeTime = '17:00';
    let breaks: Array<{ start: string; end: string }> = [{ start: '12:00', end: '13:00' }];

    if (clinicId && mongoose.Types.ObjectId.isValid(clinicId)) {
      const clinic = await ClinicModel.findById(clinicId).exec();
      if (clinic) {
        // 1. Holiday or blackout date check
        const holidays = (clinic as any).holidays || [];
        const blackoutDates = (clinic as any).blackoutDates || [];
        if (holidays.includes(date) || blackoutDates.includes(date)) {
          return [];
        }

        // 2. Weekly schedule lookup for day of week
        const dayOfWeek = new Date(date + 'T00:00:00Z')
          .toLocaleDateString('en-IN', {
            weekday: 'long',
            timeZone: (clinic as any).timezone || 'UTC',
          })
          .toLowerCase();

        const weeklySchedule = (clinic as any).weeklySchedule;
        if (weeklySchedule && weeklySchedule[dayOfWeek]) {
          const dayConfig = weeklySchedule[dayOfWeek];
          if (dayConfig.isOpen === false) {
            if ((clinic as any).emergencyAvailable) {
              openTime = '10:00';
              closeTime = '16:00';
            } else if ((clinic as any).openingHours?.[dayOfWeek]?.open && (clinic as any).openingHours[dayOfWeek].open !== 'closed') {
              openTime = (clinic as any).openingHours[dayOfWeek].open;
              closeTime = (clinic as any).openingHours[dayOfWeek].close;
            } else {
              return [];
            }
          } else {
            if (dayConfig.open) openTime = dayConfig.open;
            if (dayConfig.close) closeTime = dayConfig.close;
            if (Array.isArray(dayConfig.breaks)) breaks = dayConfig.breaks;
          }
        }

        if (clinic.slotDuration) {
          slotDuration = clinic.slotDuration;
        }
      }
    }

    // 3. Generate dynamic slot intervals
    const slots: string[] = [];
    const [openH, openM] = openTime.split(':').map(Number);
    const [closeH, closeM] = closeTime.split(':').map(Number);
    const startMinutes = openH * 60 + openM;
    const endMinutes = closeH * 60 + closeM;

    for (let cur = startMinutes; cur + slotDuration <= endMinutes; cur += slotDuration) {
      const h = Math.floor(cur / 60).toString().padStart(2, '0');
      const m = (cur % 60).toString().padStart(2, '0');
      const timeStr = `${h}:${m}`;
      const slotEndMinutes = cur + slotDuration;

      // Check if slot overlaps with any scheduled break
      const isDuringBreak = breaks.some((b) => {
        const [bStartH, bStartM] = b.start.split(':').map(Number);
        const [bEndH, bEndM] = b.end.split(':').map(Number);
        const bStartMinutes = bStartH * 60 + bStartM;
        const bEndMinutes = bEndH * 60 + bEndM;
        return (cur >= bStartMinutes && cur < bEndMinutes) ||
               (slotEndMinutes > bStartMinutes && slotEndMinutes <= bEndMinutes);
      });

      if (!isDuringBreak) {
        slots.push(timeStr);
      }
    }

    // 4. Query existing bookings and filter out taken slots
    const filter: any = {
      appointmentDate: date,
      status: { $in: ['scheduled', 'confirmed'] },
    };

    if (clinicId && mongoose.Types.ObjectId.isValid(clinicId)) {
      filter.clinicId = clinicId;
    }

    const booked = await AppointmentModel.find(filter).exec();
    const bookedTimes = new Set(booked.map((b) => b.startTime));

    return slots.filter((slot) => !bookedTimes.has(slot));
  },

  async bookAppointment(
    ownerId: string,
    data: {
      petId: string;
      clinicId?: string;
      appointmentDate: string;
      startTime: string;
      type: any;
      notes?: string;
      fee?: number;
    }
  ): Promise<IAppointment> {
    // 1. Verify pet ownership
    const pet = await petService.getPetById(data.petId, ownerId);

    // 2. Prevent past appointment dates
    const requestedDateTime = new Date(`${data.appointmentDate}T${data.startTime}:00`);
    if (requestedDateTime.getTime() < Date.now()) {
      throw new AppError('Cannot book an appointment in the past', 400, 'INVALID_DATE');
    }

    // 3. Double-booking conflict check
    if (data.clinicId && mongoose.Types.ObjectId.isValid(data.clinicId)) {
      const conflict = await AppointmentModel.findOne({
        clinicId: data.clinicId,
        appointmentDate: data.appointmentDate,
        startTime: data.startTime,
        status: { $in: ['scheduled', 'confirmed'] },
      }).exec();

      if (conflict) {
        throw new ConflictError('This appointment slot is no longer available.');
      }
    }

    // 4. Calculate end time (30 mins default)
    const [h, m] = data.startTime.split(':').map(Number);
    const endMinutes = h * 60 + m + 30;
    const endH = Math.floor(endMinutes / 60).toString().padStart(2, '0');
    const endM = (endMinutes % 60).toString().padStart(2, '0');
    const endTime = `${endH}:${endM}`;

    // 5. Create Appointment document
    const appointmentDoc = await AppointmentModel.create({
      ownerId,
      petId: data.petId,
      clinicId: data.clinicId || undefined,
      appointmentDate: data.appointmentDate,
      startTime: data.startTime,
      endTime,
      scheduledAt: requestedDateTime.toISOString(),
      duration: 30,
      type: data.type || 'checkup',
      status: 'scheduled',
      notes: data.notes,
      fee: data.fee !== undefined ? data.fee : undefined,
      paymentStatus: 'pending',
    });

    const appointment = appointmentDoc.toJSON() as unknown as IAppointment;

    // 6. Auto-create Reminder record (24 hours prior)
    const reminderTrigger = new Date(requestedDateTime.getTime() - 24 * 60 * 60 * 1000);
    const reminder = await reminderRepository.create({
      ownerId,
      petId: data.petId,
      type: 'appointment',
      title: `Upcoming Veterinary Appointment for ${pet.name}`,
      message: `Appointment scheduled for ${data.appointmentDate} at ${data.startTime}.`,
      frequency: 'once',
      timezone: 'UTC',
      nextTrigger: reminderTrigger > new Date() ? reminderTrigger.toISOString() : requestedDateTime.toISOString(),
      priority: 'high',
      isActive: true,
      linkedEntityId: appointment._id.toString(),
      notificationChannels: ['in-app', 'push'],
    });

    await AppointmentModel.findByIdAndUpdate(appointment._id, { reminderId: reminder._id.toString() });

    // 7. Dispatch Notification
    await notificationService.dispatch(
      ownerId,
      'Appointment Booked Successfully',
      `Appointment for ${pet.name} set for ${data.appointmentDate} at ${data.startTime}.`,
      'appointment',
      'medium',
      ['in-app'],
      { appointmentId: appointment._id, petId: data.petId }
    );

    // 8. Emit EventBus Event & Timeline Entry
    await eventBus.publish(
      appointment._id.toString(),
      'Appointment',
      DomainEventType.AppointmentBooked,
      { appointmentId: appointment._id.toString(), petId: data.petId, ownerId },
      { source: 'appointment-service', userId: ownerId },
      ownerId
    );

    await TimelineService.addEvent({
      petId: data.petId,
      type: 'doctor_visit',
      title: 'Appointment Scheduled',
      description: `Appointment booked for ${data.appointmentDate} at ${data.startTime}.`,
      metadata: { appointmentId: appointment._id },
    });

    return appointment;
  },

  async getUserAppointments(
    ownerId: string,
    query: { status?: string; petId?: string; limit?: number } = {}
  ): Promise<IAppointment[]> {
    const filter: any = { ownerId };
    if (query.status) {
      if (query.status === 'upcoming') {
        filter.status = { $in: ['scheduled', 'confirmed'] };
      } else {
        filter.status = query.status;
      }
    }
    if (query.petId) filter.petId = query.petId;

    const list = await AppointmentModel.find(filter)
      .sort({ appointmentDate: 1, startTime: 1 })
      .limit(query.limit || 100)
      .exec();

    return list.map((a) => a.toJSON() as unknown as IAppointment);
  },

  async getAppointmentById(id: string, ownerId: string, isAdmin = false): Promise<IAppointment> {
    const appt = await AppointmentModel.findById(id).exec();
    if (!appt) throw new NotFoundError('Appointment');
    if (!isAdmin && appt.ownerId.toString() !== ownerId) {
      throw new ForbiddenError('You do not own this appointment');
    }
    return appt.toJSON() as unknown as IAppointment;
  },

  async cancelAppointment(
    id: string,
    ownerId: string,
    reason?: string,
    isAdmin = false
  ): Promise<IAppointment> {
    const appt = await AppointmentModel.findById(id).exec();
    if (!appt) throw new NotFoundError('Appointment');
    if (!isAdmin && appt.ownerId.toString() !== ownerId) {
      throw new ForbiddenError('You do not own this appointment');
    }

    appt.status = 'cancelled';
    appt.cancellationReason = reason || 'Cancelled by user';
    await appt.save();

    await notificationService.dispatch(
      ownerId,
      'Appointment Cancelled',
      `Your appointment on ${appt.appointmentDate} at ${appt.startTime} has been cancelled.`,
      'appointment',
      'medium',
      ['in-app'],
      { appointmentId: id }
    );

    // Emit AppointmentCancelled domain event
    await eventBus.publish(
      id,
      'Appointment',
      DomainEventType.AppointmentCancelled,
      { appointmentId: id, ownerId, reason: reason || 'Cancelled by user' },
      { source: 'appointment-service', userId: ownerId },
      ownerId
    );

    return appt.toJSON() as unknown as IAppointment;
  },

  async completeAppointment(id: string, ownerId: string, isAdmin = false): Promise<IAppointment> {
    const appt = await AppointmentModel.findById(id).exec();
    if (!appt) throw new NotFoundError('Appointment');
    if (!isAdmin && appt.ownerId.toString() !== ownerId) {
      throw new ForbiddenError('You do not own this appointment');
    }

    appt.status = 'completed';
    await appt.save();
    return appt.toJSON() as unknown as IAppointment;
  },

  async rescheduleAppointment(
    id: string,
    ownerId: string,
    data: { appointmentDate: string; startTime: string },
    isAdmin = false
  ): Promise<IAppointment> {
    const appt = await AppointmentModel.findById(id).exec();
    if (!appt) throw new NotFoundError('Appointment');
    if (!isAdmin && appt.ownerId.toString() !== ownerId) {
      throw new ForbiddenError('You do not own this appointment');
    }

    // 1. Guard against rescheduling cancelled or completed appointments
    if (appt.status === 'cancelled') {
      throw new AppError('Cannot reschedule a cancelled appointment', 400, 'APPOINTMENT_CANCELLED');
    }
    if (appt.status === 'completed') {
      throw new AppError('Cannot reschedule a completed appointment', 400, 'APPOINTMENT_COMPLETED');
    }

    // 2. Reject past dates/times
    const requestedDateTime = new Date(`${data.appointmentDate}T${data.startTime}:00`);
    if (requestedDateTime.getTime() < Date.now()) {
      throw new AppError('Cannot reschedule an appointment to the past', 400, 'INVALID_DATE');
    }

    // 3. Double-booking conflict check
    if (appt.clinicId && mongoose.Types.ObjectId.isValid(appt.clinicId.toString())) {
      const conflict = await AppointmentModel.findOne({
        _id: { $ne: appt._id },
        clinicId: appt.clinicId,
        appointmentDate: data.appointmentDate,
        startTime: data.startTime,
        status: { $in: ['scheduled', 'confirmed'] },
      }).exec();

      if (conflict) {
        throw new ConflictError('This appointment slot is no longer available.');
      }

      // Verify slot is within clinic's operating schedule
      const availableSlots = await appointmentService.getAvailableSlots(
        appt.clinicId.toString(),
        data.appointmentDate
      );
      if (availableSlots.length > 0 && !availableSlots.includes(data.startTime)) {
        throw new ConflictError('The selected time slot is outside the clinic operating hours or blocked.');
      }
    }

    // 4. Calculate new end time
    const [h, m] = data.startTime.split(':').map(Number);
    const duration = appt.duration || 30;
    const endMinutes = h * 60 + m + duration;
    const endH = Math.floor(endMinutes / 60).toString().padStart(2, '0');
    const endM = (endMinutes % 60).toString().padStart(2, '0');

    appt.appointmentDate = data.appointmentDate;
    appt.startTime = data.startTime;
    appt.endTime = `${endH}:${endM}`;
    appt.scheduledAt = requestedDateTime.toISOString();
    appt.status = 'confirmed';
    await appt.save();

    // 5. Update linked reminder if present
    try {
      const reminder = await reminderRepository.findLinked(appt._id.toString());
      if (reminder) {
        const reminderTrigger = new Date(requestedDateTime.getTime() - 24 * 60 * 60 * 1000);
        await reminderRepository.update((reminder as any)._id.toString(), {
          nextTrigger: (reminderTrigger.getTime() > Date.now() ? reminderTrigger : requestedDateTime).toISOString(),
          message: `Upcoming appointment scheduled for ${data.appointmentDate} at ${data.startTime}.`,
        });
      }
    } catch {
      // Non-blocking reminder sync
    }

    // 6. Publish domain event
    eventBus.publish(
      appt._id.toString(),
      'Appointment',
      DomainEventType.AppointmentRescheduled,
      {
        appointmentId: appt._id.toString(),
        ownerId,
        newDate: data.appointmentDate,
        newTime: data.startTime,
      },
      {},
      ownerId
    );

    // 7. Dispatch user notification
    await notificationService.dispatch(
      ownerId,
      'Appointment Rescheduled',
      `Your appointment has been rescheduled to ${data.appointmentDate} at ${data.startTime}.`,
      'appointment',
      'medium',
      ['in-app'],
      { appointmentId: id }
    );

    return appt.toJSON() as unknown as IAppointment;
  },

  async updateClinicSchedule(
    clinicId: string,
    ownerId: string,
    data: {
      weeklySchedule?: any;
      slotDuration?: number;
      holidays?: string[];
      blackoutDates?: string[];
      timezone?: string;
    },
    isAdmin = false
  ): Promise<IClinic> {
    if (!mongoose.Types.ObjectId.isValid(clinicId)) throw new NotFoundError('Clinic');
    const clinic = await ClinicModel.findById(clinicId).exec();
    if (!clinic) throw new NotFoundError('Clinic');

    if (!isAdmin && clinic.ownerId.toString() !== ownerId) {
      throw new ForbiddenError('You do not have permission to manage this clinic schedule');
    }

    if (data.weeklySchedule) clinic.weeklySchedule = data.weeklySchedule;
    if (data.slotDuration) clinic.slotDuration = data.slotDuration;
    if (data.holidays) clinic.holidays = data.holidays;
    if (data.blackoutDates) clinic.blackoutDates = data.blackoutDates;
    if (data.timezone) clinic.timezone = data.timezone;

    await clinic.save();
    return clinic.toJSON() as unknown as IClinic;
  },
};
