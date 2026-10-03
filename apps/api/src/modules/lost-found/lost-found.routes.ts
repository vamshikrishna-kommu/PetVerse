import { Router } from 'express';
import { z } from 'zod';
import { lostFoundController } from './lost-found.controller';
import { authenticate, optionalAuth, requireRole } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';

const router: Router = Router();

const createReportSchema = z.object({
  type: z.enum(['lost', 'found']),
  petId: z.string().optional(),
  petName: z.string().max(100).optional(),
  species: z.enum(['dog', 'cat', 'bird', 'rabbit', 'other']),
  breed: z.string().max(100).optional(),
  color: z.string().max(50).optional(),
  gender: z.enum(['male', 'female', 'unknown']).optional(),
  contactMethod: z.enum(['in_app', 'phone', 'email']).optional(),
  contactPhone: z.string().max(20).optional(),
  contactEmail: z.string().email().optional(),
  location: z.object({
    coordinates: z.tuple([z.number(), z.number()]), // [lng, lat]
    address: z.string().min(3).max(300),
    city: z.string().max(100).optional(),
  }),
  eventDate: z.string(),
  description: z.string().min(5).max(2000),
  photos: z.array(z.string()).optional(),
});

const sendInquirySchema = z.object({
  message: z.string().min(2).max(1000),
  contactInfo: z.string().max(200).optional(),
});

const moderateSchema = z.object({
  moderationStatus: z.enum(['approved', 'flagged', 'rejected']),
});

// Public browsing routes (supports optional auth to personalize responses)
router.get('/', optionalAuth, lostFoundController.getReports);
router.get('/:id', optionalAuth, lostFoundController.getReportById);

// Protected routes (user must be authenticated)
router.post('/', authenticate, validate(createReportSchema), lostFoundController.createReport);
router.get('/:id/matches', authenticate, lostFoundController.findMatches);
router.post('/:id/inquiry', authenticate, validate(sendInquirySchema), lostFoundController.sendInquiry);
router.patch('/:id/resolve', authenticate, lostFoundController.resolveReport);

// Admin moderation route
router.patch(
  '/:id/moderate',
  authenticate,
  requireRole('admin'),
  validate(moderateSchema),
  lostFoundController.moderateReport
);

export default router;
