import { CommunityPostModel, CommunityCommentModel } from './community.model';
import { userRepository } from '../users/user.repository';
import { PetModel } from '../pets/pet.model';
import { NotFoundError, ForbiddenError, AppError } from '../../shared/errors/AppError';
import type { ICommunityPost, ICommunityComment } from '@petverse/shared-types';

export interface CreatePostDTO {
  petId?: string;
  title: string;
  content: string;
  images?: string[];
  tags?: string[];
}

export interface UpdatePostDTO {
  title?: string;
  content?: string;
  images?: string[];
  tags?: string[];
  isPinned?: boolean;
}

export interface CommunityQueryDTO {
  tag?: string;
  search?: string;
  authorId?: string;
  petId?: string;
  page?: number;
  limit?: number;
}

export class CommunityService {
  async createPost(userId: string, data: CreatePostDTO): Promise<ICommunityPost> {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const authorName = `${user.profile.firstName} ${user.profile.lastName}`.trim() || 'Pet Caretaker';
    const authorAvatar = user.profile.avatar;

    let petName: string | undefined;
    let petSpecies: string | undefined;

    if (data.petId) {
      const pet = await PetModel.findOne({ _id: data.petId, isDeleted: { $ne: true } });
      if (pet) {
        petName = pet.name;
        petSpecies = pet.species;
      }
    }

    const post = await CommunityPostModel.create({
      authorId: userId,
      authorName,
      authorAvatar,
      petId: data.petId,
      petName,
      petSpecies,
      title: data.title,
      content: data.content,
      images: data.images || [],
      tags: data.tags || [],
      likes: [],
      likesCount: 0,
      commentsCount: 0,
      isPinned: false,
      status: 'published',
    });

    return {
      ...(post.toJSON() as unknown as ICommunityPost),
      isLiked: false,
    };
  }

  async getPosts(
    currentUserId?: string,
    query: CommunityQueryDTO = {}
  ): Promise<{ posts: ICommunityPost[]; total: number; page: number; totalPages: number }> {
    const filter: any = { status: 'published' };

    if (query.tag) {
      filter.tags = query.tag.toLowerCase();
    }

    if (query.authorId) {
      filter.authorId = query.authorId;
    }

    if (query.petId) {
      filter.petId = query.petId;
    }

    if (query.search && query.search.trim()) {
      const q = query.search.trim();
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { content: { $regex: q, $options: 'i' } },
        { authorName: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } },
      ];
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(50, Number(query.limit) || 15));
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      CommunityPostModel.find(filter)
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CommunityPostModel.countDocuments(filter),
    ]);

    const formattedPosts: ICommunityPost[] = posts.map((doc: any) => ({
      _id: doc._id.toString(),
      authorId: doc.authorId,
      authorName: doc.authorName,
      authorAvatar: doc.authorAvatar,
      petId: doc.petId,
      petName: doc.petName,
      petSpecies: doc.petSpecies,
      title: doc.title,
      content: doc.content,
      images: doc.images || [],
      tags: doc.tags || [],
      likesCount: doc.likesCount || 0,
      commentsCount: doc.commentsCount || 0,
      isLiked: currentUserId ? (doc.likes || []).includes(currentUserId) : false,
      isPinned: doc.isPinned || false,
      status: doc.status,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
    }));

    return {
      posts: formattedPosts,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getPostById(postId: string, currentUserId?: string): Promise<ICommunityPost> {
    const post = await CommunityPostModel.findById(postId).lean();
    if (!post || post.status === 'hidden') {
      throw new NotFoundError('Community post not found');
    }

    return {
      _id: post._id.toString(),
      authorId: post.authorId,
      authorName: post.authorName,
      authorAvatar: post.authorAvatar,
      petId: post.petId,
      petName: post.petName,
      petSpecies: post.petSpecies,
      title: post.title,
      content: post.content,
      images: post.images || [],
      tags: post.tags || [],
      likesCount: post.likesCount || 0,
      commentsCount: post.commentsCount || 0,
      isLiked: currentUserId ? (post.likes || []).includes(currentUserId) : false,
      isPinned: post.isPinned || false,
      status: post.status,
      createdAt: (post as any).createdAt.toISOString(),
      updatedAt: (post as any).updatedAt.toISOString(),
    };
  }

  async updatePost(userId: string, postId: string, data: UpdatePostDTO, isAdmin = false): Promise<ICommunityPost> {
    const post = await CommunityPostModel.findById(postId);
    if (!post) throw new NotFoundError('Community post not found');

    if (post.authorId !== userId && !isAdmin) {
      throw new ForbiddenError('You can only edit your own posts');
    }

    if (data.title) post.title = data.title;
    if (data.content) post.content = data.content;
    if (data.images) post.images = data.images;
    if (data.tags) post.tags = data.tags;
    if (data.isPinned !== undefined && isAdmin) post.isPinned = data.isPinned;

    await post.save();
    return {
      ...(post.toJSON() as unknown as ICommunityPost),
      isLiked: post.likes.includes(userId),
    };
  }

  async deletePost(userId: string, postId: string, isAdmin = false): Promise<void> {
    const post = await CommunityPostModel.findById(postId);
    if (!post) throw new NotFoundError('Community post not found');

    if (post.authorId !== userId && !isAdmin) {
      throw new ForbiddenError('You can only delete your own posts');
    }

    await Promise.all([
      post.deleteOne(),
      CommunityCommentModel.deleteMany({ postId }),
    ]);
  }

  async toggleLike(userId: string, postId: string): Promise<{ isLiked: boolean; likesCount: number }> {
    const post = await CommunityPostModel.findById(postId);
    if (!post) throw new NotFoundError('Community post not found');

    const hasLiked = post.likes.includes(userId);

    if (hasLiked) {
      post.likes = post.likes.filter((id) => id !== userId);
      post.likesCount = Math.max(0, post.likesCount - 1);
    } else {
      post.likes.push(userId);
      post.likesCount += 1;
    }

    await post.save();
    return {
      isLiked: !hasLiked,
      likesCount: post.likesCount,
    };
  }

  async reportPost(userId: string, postId: string, reason: string): Promise<void> {
    const post = await CommunityPostModel.findById(postId);
    if (!post) throw new NotFoundError('Community post not found');

    post.reports.push({
      reporterId: userId,
      reason,
      createdAt: new Date(),
    });

    if (post.reports.length >= 3) {
      post.status = 'flagged';
    }

    await post.save();
  }

  async getComments(postId: string): Promise<ICommunityComment[]> {
    const comments = await CommunityCommentModel.find({ postId, status: 'published' })
      .sort({ createdAt: 1 })
      .lean();

    return comments.map((c: any) => ({
      _id: c._id.toString(),
      postId: c.postId,
      authorId: c.authorId,
      authorName: c.authorName,
      authorAvatar: c.authorAvatar,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));
  }

  async createComment(userId: string, postId: string, content: string): Promise<ICommunityComment> {
    const post = await CommunityPostModel.findById(postId);
    if (!post) throw new NotFoundError('Post not found');

    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    const authorName = `${user.profile.firstName} ${user.profile.lastName}`.trim() || 'Pet Caretaker';
    const authorAvatar = user.profile.avatar;

    const comment = await CommunityCommentModel.create({
      postId,
      authorId: userId,
      authorName,
      authorAvatar,
      content,
      status: 'published',
    });

    post.commentsCount += 1;
    await post.save();

    return comment.toJSON() as unknown as ICommunityComment;
  }

  async deleteComment(userId: string, commentId: string, isAdmin = false): Promise<void> {
    const comment = await CommunityCommentModel.findById(commentId);
    if (!comment) throw new NotFoundError('Comment not found');

    if (comment.authorId !== userId && !isAdmin) {
      throw new ForbiddenError('You can only delete your own comments');
    }

    const postId = comment.postId;
    await comment.deleteOne();

    await CommunityPostModel.findByIdAndUpdate(postId, {
      $inc: { commentsCount: -1 },
    });
  }

  async moderatePost(adminId: string, postId: string, status: 'published' | 'hidden' | 'flagged'): Promise<ICommunityPost> {
    const post = await CommunityPostModel.findByIdAndUpdate(
      postId,
      { status },
      { new: true }
    );
    if (!post) throw new NotFoundError('Post not found');
    return post.toJSON() as unknown as ICommunityPost;
  }
}

export const communityService = new CommunityService();
