import mongoose from 'mongoose';
import { communityService } from '../community.service';
import { CommunityPostModel, CommunityCommentModel } from '../community.model';
import { UserModel } from '../../users/user.model';
import { PetModel } from '../../pets/pet.model';
import { ForbiddenError, NotFoundError } from '../../../shared/errors/AppError';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/petverse_test';

describe('Community Service — Unit & Integration Tests', () => {
  let authorId: string;
  let strangerId: string;
  let petId: string;
  let createdPostId: string;
  let createdCommentId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }

    const author = await UserModel.create({
      email: `community_author_${Date.now()}@testverse.com`,
      profile: { firstName: 'Sarah', lastName: 'Connor' },
      passwordHash: 'dummyhash123',
      role: 'pet_owner',
      isVerified: true,
      isActive: true,
    });
    authorId = author._id.toString();

    const stranger = await UserModel.create({
      email: `community_stranger_${Date.now()}@testverse.com`,
      profile: { firstName: 'Kyle', lastName: 'Reese' },
      passwordHash: 'dummyhash123',
      role: 'pet_owner',
      isVerified: true,
      isActive: true,
    });
    strangerId = stranger._id.toString();

    const pet = await PetModel.create({
      ownerId: new mongoose.Types.ObjectId(authorId),
      name: 'Wolfie',
      species: 'dog',
      breed: 'German Shepherd',
      dob: '2022-01-10',
    });
    petId = pet._id.toString();
  });

  afterAll(async () => {
    await UserModel.deleteMany({ _id: { $in: [authorId, strangerId] } });
    await PetModel.findByIdAndDelete(petId);
    await CommunityPostModel.deleteMany({ authorId });
    await CommunityCommentModel.deleteMany({ authorId });
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  it('should create a community post linked to author and pet', async () => {
    const post = await communityService.createPost(authorId, {
      title: 'Hiking with Wolfie this weekend!',
      content: 'Any recommendations for dog-friendly trails near Lake Tahoe?',
      petId,
      tags: ['hiking', 'adventure', 'dogs'],
    });

    expect(post._id).toBeDefined();
    expect(post.title).toBe('Hiking with Wolfie this weekend!');
    expect(post.authorName).toBe('Sarah Connor');
    expect(post.petName).toBe('Wolfie');
    expect(post.tags).toContain('hiking');
    expect(post.likesCount).toBe(0);

    createdPostId = post._id.toString();
  });

  it('should list posts with pagination and filter by tag', async () => {
    const result = await communityService.getPosts(authorId, {
      tag: 'hiking',
      page: 1,
      limit: 10,
    });

    expect(result.posts.length).toBeGreaterThan(0);
    expect(result.posts.some((p) => p._id.toString() === createdPostId)).toBe(true);
    expect(result.total).toBeGreaterThan(0);
  });

  it('should get post by ID with like status', async () => {
    const post = await communityService.getPostById(createdPostId, authorId);
    expect(post._id.toString()).toBe(createdPostId);
    expect(post.isLiked).toBe(false);
  });

  it('should toggle like on post', async () => {
    // Like
    const likeResult = await communityService.toggleLike(authorId, createdPostId);
    expect(likeResult.isLiked).toBe(true);
    expect(likeResult.likesCount).toBe(1);

    // Unlike
    const unlikeResult = await communityService.toggleLike(authorId, createdPostId);
    expect(unlikeResult.isLiked).toBe(false);
    expect(unlikeResult.likesCount).toBe(0);
  });

  it('should add comment and increment comments count', async () => {
    const comment = await communityService.createComment(
      strangerId,
      createdPostId,
      'Eagle Rock trail is amazing for active dogs!'
    );

    expect(comment._id).toBeDefined();
    expect(comment.content).toBe('Eagle Rock trail is amazing for active dogs!');
    expect(comment.authorName).toBe('Kyle Reese');

    createdCommentId = comment._id.toString();

    const post = await communityService.getPostById(createdPostId);
    expect(post.commentsCount).toBe(1);
  });

  it('should prevent unauthorized user from updating or deleting another author’s post', async () => {
    await expect(
      communityService.updatePost(strangerId, createdPostId, { title: 'Hacked Title' })
    ).rejects.toThrow(ForbiddenError);

    await expect(
      communityService.deletePost(strangerId, createdPostId)
    ).rejects.toThrow(ForbiddenError);
  });

  it('should allow author to delete comment and post', async () => {
    await communityService.deleteComment(strangerId, createdCommentId);
    const postAfterCommentDel = await communityService.getPostById(createdPostId);
    expect(postAfterCommentDel.commentsCount).toBe(0);

    await communityService.deletePost(authorId, createdPostId);
    await expect(communityService.getPostById(createdPostId)).rejects.toThrow(NotFoundError);
  });
});
