import api from '../../shared/lib/axios';
import type { IProduct, IOrder, OrderStatus } from '@petverse/shared-types';

export interface ProductQueryParams {
  category?: string;
  species?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest';
  page?: number;
  limit?: number;
}

export interface CreateOrderPayload {
  items: Array<{ productId: string; quantity: number }>;
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
    landmark?: string;
  };
  paymentMethod?: 'razorpay' | 'cod' | 'test';
}

export interface VerifyPaymentPayload {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export interface UpdateOrderStatusPayload {
  status: OrderStatus;
  trackingNumber?: string;
  courier?: string;
  estimatedDelivery?: string;
  note?: string;
}

export const marketplaceApi = {
  getProducts: (params?: ProductQueryParams) =>
    api
      .get<{ data: { products: IProduct[]; total: number; page: number; totalPages: number } }>(
        '/marketplace/products',
        { params }
      )
      .then((res) => res.data.data),

  getProduct: (id: string) =>
    api.get<{ data: IProduct }>(`/marketplace/products/${id}`).then((res) => res.data.data),

  createOrder: (data: CreateOrderPayload) =>
    api.post<{ data: IOrder }>('/marketplace/orders', data).then((res) => res.data.data),

  verifyRazorpayPayment: (orderId: string, data: VerifyPaymentPayload) =>
    api
      .post<{ data: IOrder }>(`/marketplace/orders/${orderId}/verify-payment`, data)
      .then((res) => res.data.data),

  cancelOrder: (orderId: string, reason?: string) =>
    api
      .post<{ data: IOrder }>(`/marketplace/orders/${orderId}/cancel`, { reason })
      .then((res) => res.data.data),

  getMyOrders: () =>
    api.get<{ data: IOrder[] }>('/marketplace/orders').then((res) => res.data.data),

  getOrder: (id: string) =>
    api.get<{ data: IOrder }>(`/marketplace/orders/${id}`).then((res) => res.data.data),

  // Admin APIs
  getAdminOrders: (params?: { status?: string; search?: string; page?: number; limit?: number }) =>
    api
      .get<{ data: { orders: IOrder[]; total: number; page: number; totalPages: number } }>(
        '/marketplace/admin/orders',
        { params }
      )
      .then((res) => res.data.data),

  updateOrderStatus: (orderId: string, data: UpdateOrderStatusPayload) =>
    api
      .patch<{ data: IOrder }>(`/marketplace/admin/orders/${orderId}/status`, data)
      .then((res) => res.data.data),
};
