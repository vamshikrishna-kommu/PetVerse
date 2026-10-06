import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketplaceApi, type ProductQueryParams, type VerifyPaymentPayload, type UpdateOrderStatusPayload } from '@/services/api/marketplaceApi';

export const marketplaceQueryKeys = {
  all: ['marketplace'] as const,
  products: (params: any) => [...marketplaceQueryKeys.all, 'products', params] as const,
  product: (id: string) => [...marketplaceQueryKeys.all, 'product', id] as const,
  orders: () => [...marketplaceQueryKeys.all, 'orders'] as const,
  order: (id: string) => [...marketplaceQueryKeys.all, 'order', id] as const,
  adminOrders: (params: any) => [...marketplaceQueryKeys.all, 'adminOrders', params] as const,
};

export function useMarketplaceProducts(params: ProductQueryParams = {}) {
  return useQuery({
    queryKey: marketplaceQueryKeys.products(params),
    queryFn: () => marketplaceApi.getProducts(params),
    placeholderData: (prev) => prev,
  });
}

export function useMarketplaceProduct(id: string) {
  return useQuery({
    queryKey: marketplaceQueryKeys.product(id),
    queryFn: () => marketplaceApi.getProduct(id),
    enabled: !!id,
  });
}

export function useMyOrders() {
  return useQuery({
    queryKey: marketplaceQueryKeys.orders(),
    queryFn: () => marketplaceApi.getMyOrders(),
  });
}

export function useOrderDetails(id: string) {
  return useQuery({
    queryKey: marketplaceQueryKeys.order(id),
    queryFn: () => marketplaceApi.getOrder(id),
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: marketplaceApi.createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketplaceQueryKeys.all });
    },
  });
}

export function useVerifyPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: VerifyPaymentPayload }) =>
      marketplaceApi.verifyRazorpayPayment(orderId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: marketplaceQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: marketplaceQueryKeys.order(variables.orderId) });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, reason }: { orderId: string; reason?: string }) =>
      marketplaceApi.cancelOrder(orderId, reason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: marketplaceQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: marketplaceQueryKeys.order(variables.orderId) });
    },
  });
}

export function useAdminOrders(params: any = {}) {
  return useQuery({
    queryKey: marketplaceQueryKeys.adminOrders(params),
    queryFn: () => marketplaceApi.getAdminOrders(params),
    placeholderData: (prev) => prev,
  });
}

export function useUpdateAdminOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: UpdateOrderStatusPayload }) =>
      marketplaceApi.updateOrderStatus(orderId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: marketplaceQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: marketplaceQueryKeys.order(variables.orderId) });
      queryClient.invalidateQueries({ queryKey: marketplaceQueryKeys.adminOrders({}) });
    },
  });
}
