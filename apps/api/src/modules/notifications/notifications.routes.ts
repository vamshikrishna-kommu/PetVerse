import { Router } from 'express';
import { notificationsController } from './notifications.controller';
import { authenticate, requireRole } from '../../middlewares/auth.middleware';

import { sseService } from './sse.service';

const router = Router();

router.use(authenticate);

// Real-time Server-Sent Events stream
router.get('/stream', (req, res) => {
  sseService.addClient(req.user!.userId, res);
});

router.get('/feed', notificationsController.getFeed);
router.get('/unread-count', notificationsController.getUnreadCount);
router.patch('/read-all', notificationsController.markAllAsRead);
router.patch('/:id/read', notificationsController.markAsRead);
router.post('/fcm-token', notificationsController.registerFcmToken);
router.delete('/fcm-token', notificationsController.removeFcmToken);

// Admin Dead-Letter Queue & Analytics
router.get('/dead-letters', requireRole('admin'), notificationsController.getDeadLetterQueue);
router.post('/dead-letters/:id/retry', requireRole('admin'), notificationsController.retryDeadLetter);
router.get('/analytics', requireRole('admin'), notificationsController.getAnalytics);

export const notificationRoutes: Router = router;
