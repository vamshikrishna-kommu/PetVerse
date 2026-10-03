import { Router } from 'express';
import { appointmentController } from './controllers/appointment.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import {
  bookAppointmentSchema,
  cancelAppointmentSchema,
  rescheduleAppointmentSchema,
  getAvailableSlotsSchema,
} from '../../shared/validation/schemas';

const router: Router = Router();

router.use(authenticate);

router.get('/available-slots', validate(getAvailableSlotsSchema, 'query'), appointmentController.getAvailableSlots);
router.post('/', validate(bookAppointmentSchema), appointmentController.bookAppointment);
router.get('/', appointmentController.getUserAppointments);
router.get('/:id', appointmentController.getAppointmentById);
router.put('/:id', validate(rescheduleAppointmentSchema), appointmentController.rescheduleAppointment);
router.post('/:id/cancel', validate(cancelAppointmentSchema), appointmentController.cancelAppointment);
router.post('/:id/complete', appointmentController.completeAppointment);
router.patch('/clinics/:id/schedule', appointmentController.updateClinicSchedule);

export default router;

