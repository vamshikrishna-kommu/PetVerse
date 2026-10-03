import { Router } from 'express';
import { userController } from './user.controller';
import { authenticate, requireRole } from '../../middlewares/auth.middleware';
import { uploadAvatar } from '../../middlewares/upload.middleware';
import { validate } from '../../middlewares/validate.middleware';
import { updateProfileSchema } from '../../shared/validation/schemas';

const router: Router = Router();

// User profile & lifecycle routes
router.get('/me', authenticate, userController.getMe);
router.patch('/me', authenticate, validate(updateProfileSchema), userController.updateMe);
router.patch('/me/preferences', authenticate, userController.updatePreferences);
router.post('/me/change-password', authenticate, userController.changePassword);
router.get('/me/export', authenticate, userController.exportUserData);
router.delete('/me', authenticate, userController.deleteAccount);
router.post('/me/avatar', authenticate, uploadAvatar, userController.uploadAvatar);
router.get('/me/stats', authenticate, userController.getStats);

// Admin-only management routes
router.get('/', authenticate, requireRole('admin'), userController.listUsers);
router.get('/admin/stats', authenticate, requireRole('admin'), userController.getAdminSystemStats);
router.get('/admin/audit-logs', authenticate, requireRole('admin'), userController.getAuditLogs);
router.get('/admin/pets', authenticate, requireRole('admin'), userController.listAllPets);
router.patch('/:id/status', authenticate, requireRole('admin'), userController.toggleUserStatus);

export default router;

