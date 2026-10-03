import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adoptionApi } from '@/services/api/adoptionApi';
import type { IAdoptionListing } from '@petverse/shared-types';

export const adoptionQueryKeys = {
  all: ['adoption'] as const,
  listings: (params: any) => [...adoptionQueryKeys.all, 'listings', params] as const,
  listing: (id: string) => [...adoptionQueryKeys.all, 'listing', id] as const,
  myApplications: () => [...adoptionQueryKeys.all, 'myApplications'] as const,
  listingApplications: (id: string) => [...adoptionQueryKeys.all, 'listingApplications', id] as const,
};

export function useAdoptionListings(params: any = {}) {
  return useQuery({
    queryKey: adoptionQueryKeys.listings(params),
    queryFn: () => adoptionApi.getListings(params),
    placeholderData: (prev) => prev,
  });
}

export function useAdoptionListing(id: string) {
  return useQuery({
    queryKey: adoptionQueryKeys.listing(id),
    queryFn: () => adoptionApi.getListing(id),
    enabled: !!id,
  });
}

export function useMyAdoptionApplications() {
  return useQuery({
    queryKey: adoptionQueryKeys.myApplications(),
    queryFn: () => adoptionApi.getMyApplications(),
  });
}

export function useCreateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<IAdoptionListing>) => adoptionApi.createListing(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adoptionQueryKeys.all });
    },
  });
}

export function useSubmitApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listingId, data }: { listingId: string; data: any }) =>
      adoptionApi.submitApplication(listingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adoptionQueryKeys.all });
    },
  });
}

export function useDeleteListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adoptionApi.deleteListing(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adoptionQueryKeys.all });
    },
  });
}
