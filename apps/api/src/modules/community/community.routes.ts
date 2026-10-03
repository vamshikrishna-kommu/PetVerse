import { Router } from 'express';
import { communityController } from './community.controller';
import { authenticate, optionalAuth, requireRole } from '../../middlewares/auth.middleware';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.middleware';

const router: Router = Router();

const createPostSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  content: z.string().min(10, 'Content must be at least 10 characters').max(5000),
  petId: z.string().optional(),
  images: z.array(z.string().url()).max(10).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
});

const updatePostSchema = createPostSchema.partial();

const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000),
});

const reportSchema = z.object({
  reason: z.string().min(3, 'Reason must be at least 3 characters').max(500),
});

// Post routes
router.get('/posts', optionalAuth, communityController.getPosts);
router.post('/posts', authenticate, validate(createPostSchema), communityController.createPost);
router.get('/posts/:id', optionalAuth, communityController.getPostById);
router.put('/posts/:id', authenticate, validate(updatePostSchema), communityController.updatePost);
router.delete('/posts/:id', authenticate, communityController.deletePost);

// Social reactions & reporting
router.post('/posts/:id/like', authenticate, communityController.toggleLike);
router.post('/posts/:id/report', authenticate, validate(reportSchema), communityController.reportPost);

// Comment routes
router.get('/posts/:id/comments', optionalAuth, communityController.getComments);
router.post('/posts/:id/comments', authenticate, validate(commentSchema), communityController.createComment);
router.delete('/comments/:commentId', authenticate, communityController.deleteComment);

// Admin Moderation
router.patch(
  '/posts/:id/moderate',
  authenticate,
  requireRole('admin'),
  z.object({ status: z.enum(['published', 'hidden', 'flagged']) }) ? validate(z.object({ status: z.enum(['published', 'hidden', 'flagged']) })) : (req, res, next) => next(),
  communityController.moderatePost
);

export default router;
