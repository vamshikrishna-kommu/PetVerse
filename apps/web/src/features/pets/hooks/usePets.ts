import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { petsApi, type PetQueryParams } from '../api/petsApi';
import type { IPet, IPetTimelineEvent } from '@petverse/shared-types';

export const queryKeys = {
  all: ['pets'] as const,
  lists: () => [...queryKeys.all, 'list'] as const,
  list: (params: PetQueryParams) => [...queryKeys.lists(), params] as const,
  detail: (id: string) => [...queryKeys.all, 'detail', id] as const,
  timeline: (id: string) => [...queryKeys.detail(id), 'timeline'] as const,
};

export function usePets(params: PetQueryParams = {}) {
  return useQuery({
    queryKey: queryKeys.list(params),
    queryFn: () => petsApi.getPets(params),
    placeholderData: (prev) => prev, // keeps previous data while fetching new (equivalent to keepPreviousData in v4)
  });
}

export function usePet(id: string) {
  return useQuery({
    queryKey: queryKeys.detail(id),
    queryFn: () => petsApi.getPet(id),
    enabled: !!id,
  });
}

export function useCreatePet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: petsApi.createPet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
    },
  });
}

export function useUpdatePet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: petsApi.updatePet,
    onSuccess: (updatedPet) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
      queryClient.setQueryData(queryKeys.detail(updatedPet._id), updatedPet);
    },
  });
}

export function useDeletePet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: petsApi.deletePet,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
      queryClient.removeQueries({ queryKey: queryKeys.detail(id) });
    },
  });
}

export function usePetTimeline(id: string) {
  return useQuery<IPetTimelineEvent[]>({
    queryKey: queryKeys.timeline(id),
    queryFn: () => petsApi.getPetTimeline(id),
    enabled: !!id,
  });
}

export function useLostPets(params: { species?: string; search?: string; page?: number; limit?: number } = {}) {
  return useQuery({
    queryKey: ['pets', 'lost', params],
    queryFn: () => petsApi.getLostPets(params),
  });
}

export function useUploadGallery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, files }: { id: string; files: File[] }) =>
      petsApi.uploadGallery(id, files),
    onSuccess: (updatedPet) => {
      queryClient.setQueryData(queryKeys.detail(updatedPet._id), updatedPet);
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
    },
  });
}

export function useRemoveGalleryImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, imageUrl }: { id: string; imageUrl: string }) =>
      petsApi.removeGalleryImage(id, imageUrl),
    onSuccess: (updatedPet) => {
      queryClient.setQueryData(queryKeys.detail(updatedPet._id), updatedPet);
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
    },
  });
}

export function useSetPrimaryGalleryImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, imageUrl }: { id: string; imageUrl: string }) =>
      petsApi.setPrimaryGalleryImage(id, imageUrl),
    onSuccess: (updatedPet) => {
      queryClient.setQueryData(queryKeys.detail(updatedPet._id), updatedPet);
      queryClient.invalidateQueries({ queryKey: queryKeys.lists() });
    },
  });
}
