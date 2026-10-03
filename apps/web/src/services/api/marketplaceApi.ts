import api from '../../shared/lib/axios';
import type { IProduct, IOrder, ProductCategory } from '@petverse/shared-types';

export const marketplaceApi = {
  getProducts: (params?: { category?: string; species?: string; search?: string; minPrice?: number; maxPrice?: number; page?: number; limit?: number }) =>
    api.get<{ data: { products: IProduct[]; total: number; page: number; totalPages: number } }>('/marketplace/products', { params }).then((res) => res.data.data),

  getProduct: (id: string) =>
    api.get<{ data: IProduct }>(`/marketplace/products/${id}`).then((res) => res.data.data),

  createOrder: (data: { items: Array<{ productId: string; quantity: number }>; shippingAddress: any }) =>
    api.post<{ data: IOrder }>('/marketplace/orders', data).then((res) => res.data.data),

  getMyOrders: () =>
    api.get<{ data: IOrder[] }>('/marketplace/orders').then((res) => res.data.data),

  getOrder: (id: string) =>
    api.get<{ data: IOrder }>(`/marketplace/orders/${id}`).then((res) => res.data.data),
};
