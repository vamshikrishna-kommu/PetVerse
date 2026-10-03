import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communityApi } from '@/services/api/communityApi';
import type { ICommunityPost } from '@petverse/shared-types';

export const communityQueryKeys = {
  all: ['community'] as const,
  posts: (params: any) => [...communityQueryKeys.all, 'posts', params] as const,
  post: (id: string) => [...communityQueryKeys.all, 'post', id] as const,
  comments: (postId: string) => [...communityQueryKeys.all, 'comments', postId] as const,
};

export function useCommunityPosts(params: any = {}) {
  return useQuery({
    queryKey: communityQueryKeys.posts(params),
    queryFn: () => communityApi.getPosts(params),
    placeholderData: (prev) => prev,
  });
}

export function useCommunityPost(id: string) {
  return useQuery({
    queryKey: communityQueryKeys.post(id),
    queryFn: () => communityApi.getPost(id),
    enabled: !!id,
  });
}

export function usePostComments(postId: string) {
  return useQuery({
    queryKey: communityQueryKeys.comments(postId),
    queryFn: () => communityApi.getComments(postId),
    enabled: !!postId,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: communityApi.createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.all });
    },
  });
}

export function useToggleLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => communityApi.toggleLike(postId),
    onSuccess: (_, postId) => {
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.post(postId) });
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.all });
    },
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) =>
      communityApi.createComment(postId, content),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.comments(postId) });
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.post(postId) });
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.all });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => communityApi.deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.all });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, postId }: { commentId: string; postId: string }) =>
      communityApi.deleteComment(commentId),
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.comments(postId) });
      queryClient.invalidateQueries({ queryKey: communityQueryKeys.post(postId) });
    },
  });
}
