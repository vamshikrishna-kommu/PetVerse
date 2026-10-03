import type { Request, Response } from 'express';
import { communityService } from './community.service';
import { apiResponse } from '../../shared/utils/apiResponse';
import { asyncHandler } from '../../middlewares/error.middleware';

export const communityController = {
  createPost: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const post = await communityService.createPost(userId, req.body);
    apiResponse.created(res, post);
  }),

  getPosts: asyncHandler(async (req: Request, res: Response) => {
    const currentUserId = req.user?.userId;
    const result = await communityService.getPosts(currentUserId, req.query as any);
    apiResponse.success(res, result);
  }),

  getPostById: asyncHandler(async (req: Request, res: Response) => {
    const currentUserId = req.user?.userId;
    const post = await communityService.getPostById(req.params.id as string, currentUserId);
    apiResponse.success(res, post);
  }),

  updatePost: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const isAdmin = req.user?.role === 'admin';
    const post = await communityService.updatePost(userId, req.params.id as string, req.body, isAdmin);
    apiResponse.success(res, post);
  }),

  deletePost: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const isAdmin = req.user?.role === 'admin';
    await communityService.deletePost(userId, req.params.id as string, isAdmin);
    apiResponse.noContent(res);
  }),

  toggleLike: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const result = await communityService.toggleLike(userId, req.params.id as string);
    apiResponse.success(res, result);
  }),

  reportPost: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { reason } = req.body;
    await communityService.reportPost(userId, req.params.id as string, reason || 'Inappropriate content');
    apiResponse.success(res, { message: 'Report submitted for review' });
  }),

  getComments: asyncHandler(async (req: Request, res: Response) => {
    const comments = await communityService.getComments(req.params.id as string);
    apiResponse.success(res, comments);
  }),

  createComment: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const comment = await communityService.createComment(userId, req.params.id as string, req.body.content);
    apiResponse.created(res, comment);
  }),

  deleteComment: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const isAdmin = req.user?.role === 'admin';
    await communityService.deleteComment(userId, req.params.commentId as string, isAdmin);
    apiResponse.noContent(res);
  }),

  moderatePost: asyncHandler(async (req: Request, res: Response) => {
    const adminId = req.user!.userId;
    const { status } = req.body;
    const post = await communityService.moderatePost(adminId, req.params.id as string, status);
    apiResponse.success(res, post);
  }),
};
