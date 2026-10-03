import api from '../../shared/lib/axios';
import type { ICommunityPost, ICommunityComment } from '@petverse/shared-types';

export const communityApi = {
  getPosts: (params?: { tag?: string; search?: string; authorId?: string; petId?: string; page?: number; limit?: number }) =>
    api.get<{ data: { posts: ICommunityPost[]; total: number; page: number; totalPages: number } }>('/community/posts', { params }).then((res) => res.data.data),

  getPost: (id: string) =>
    api.get<{ data: ICommunityPost }>(`/community/posts/${id}`).then((res) => res.data.data),

  createPost: (data: { title: string; content: string; petId?: string; images?: string[]; tags?: string[] }) =>
    api.post<{ data: ICommunityPost }>('/community/posts', data).then((res) => res.data.data),

  updatePost: (id: string, data: Partial<ICommunityPost>) =>
    api.put<{ data: ICommunityPost }>(`/community/posts/${id}`, data).then((res) => res.data.data),

  deletePost: (id: string) =>
    api.delete(`/community/posts/${id}`).then((res) => res.data),

  toggleLike: (id: string) =>
    api.post<{ data: { isLiked: boolean; likesCount: number } }>(`/community/posts/${id}/like`).then((res) => res.data.data),

  reportPost: (id: string, reason: string) =>
    api.post(`/community/posts/${id}/report`, { reason }).then((res) => res.data),

  getComments: (postId: string) =>
    api.get<{ data: ICommunityComment[] }>(`/community/posts/${postId}/comments`).then((res) => res.data.data),

  createComment: (postId: string, content: string) =>
    api.post<{ data: ICommunityComment }>(`/community/posts/${postId}/comments`, { content }).then((res) => res.data.data),

  deleteComment: (commentId: string) =>
    api.delete(`/community/comments/${commentId}`).then((res) => res.data),
};
