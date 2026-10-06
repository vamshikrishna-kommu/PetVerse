import type { Request, Response } from 'express';
import { marketplaceService } from './marketplace.service';
import { apiResponse } from '../../shared/utils/apiResponse';
import { asyncHandler } from '../../middlewares/error.middleware';

export const marketplaceController = {
  listProducts: asyncHandler(async (req: Request, res: Response) => {
    const result = await marketplaceService.listProducts(req.query as any);
    apiResponse.success(res, result);
  }),

  getProductById: asyncHandler(async (req: Request, res: Response) => {
    const product = await marketplaceService.getProductById(req.params.id as string);
    apiResponse.success(res, product);
  }),

  createProduct: asyncHandler(async (req: Request, res: Response) => {
    const product = await marketplaceService.createProduct(req.body);
    apiResponse.created(res, product);
  }),

  updateProduct: asyncHandler(async (req: Request, res: Response) => {
    const product = await marketplaceService.updateProduct(req.params.id as string, req.body);
    apiResponse.success(res, product);
  }),

  deleteProduct: asyncHandler(async (req: Request, res: Response) => {
    await marketplaceService.deleteProduct(req.params.id as string);
    apiResponse.noContent(res);
  }),

  createOrder: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const order = await marketplaceService.createOrder(userId, req.body);
    apiResponse.created(res, order);
  }),

  verifyRazorpayPayment: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const orderId = req.params.id as string;
    const order = await marketplaceService.verifyRazorpayPayment(userId, orderId, req.body);
    apiResponse.success(res, order);
  }),

  cancelOrder: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const orderId = req.params.id as string;
    const isAdmin = req.user?.role === 'admin';
    const order = await marketplaceService.cancelOrder(userId, orderId, req.body?.reason, isAdmin);
    apiResponse.success(res, order);
  }),

  getMyOrders: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const orders = await marketplaceService.getMyOrders(userId);
    apiResponse.success(res, orders);
  }),

  getOrderById: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const isAdmin = req.user?.role === 'admin';
    const order = await marketplaceService.getOrderById(userId, req.params.id as string, isAdmin);
    apiResponse.success(res, order);
  }),

  listAdminOrders: asyncHandler(async (req: Request, res: Response) => {
    const result = await marketplaceService.listAdminOrders(req.query as any);
    apiResponse.success(res, result);
  }),

  updateOrderStatus: asyncHandler(async (req: Request, res: Response) => {
    const orderId = req.params.id as string;
    const { status, trackingNumber, courier, estimatedDelivery, note } = req.body;
    const order = await marketplaceService.updateOrderStatus(orderId, status, {
      trackingNumber,
      courier,
      estimatedDelivery,
      note,
    });
    apiResponse.success(res, order);
  }),
};
