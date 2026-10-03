import { Router } from 'express';
import { remindersController } from './reminders.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { createReminderSchema, snoozeReminderSchema } from '../../shared/validation/schemas';

const router = Router();

router.use(authenticate);

router.get('/my-reminders', remindersController.getMyReminders);
router.post('/', validate(createReminderSchema), remindersController.createReminder);
router.post('/:id/snooze', validate(snoozeReminderSchema), remindersController.snoozeReminder);
router.post('/:id/complete', remindersController.markCompleted);

export const reminderRoutes: Router = router;

