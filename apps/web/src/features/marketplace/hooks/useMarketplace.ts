import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketplaceApi } from '@/services/api/marketplaceApi';

export const marketplaceQueryKeys = {
  all: ['marketplace'] as const,
  products: (params: any) => [...marketplaceQueryKeys.all, 'products', params] as const,
  product: (id: string) => [...marketplaceQueryKeys.all, 'product', id] as const,
  orders: () => [...marketplaceQueryKeys.all, 'orders'] as const,
};

export function useMarketplaceProducts(params: any = {}) {
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

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: marketplaceApi.createOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketplaceQueryKeys.all });
    },
  });
}
