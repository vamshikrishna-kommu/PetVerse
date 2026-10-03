import mongoose, { Schema, Document, Model } from 'mongoose';
import type { ICommunityPost, ICommunityComment } from '@petverse/shared-types';

export interface ICommunityPostDocument extends Omit<ICommunityPost, '_id' | 'isLiked'>, Document {
  likes: string[];
  reports: Array<{
    reporterId: string;
    reason: string;
    createdAt: Date;
  }>;
}

export interface ICommunityCommentDocument extends Omit<ICommunityComment, '_id'>, Document {
  status: 'published' | 'hidden' | 'flagged';
  reports: Array<{
    reporterId: string;
    reason: string;
    createdAt: Date;
  }>;
}

const CommunityPostSchema = new Schema<ICommunityPostDocument>(
  {
    authorId: { type: String, required: true, index: true },
    authorName: { type: String, required: true },
    authorAvatar: { type: String },
    petId: { type: String, index: true },
    petName: { type: String },
    petSpecies: { type: String },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true, trim: true, maxlength: 5000 },
    images: [{ type: String }],
    tags: [{ type: String, lowercase: true, trim: true }],
    likes: [{ type: String }],
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    isPinned: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['published', 'hidden', 'flagged'],
      default: 'published',
      index: true,
    },
    reports: [
      {
        reporterId: { type: String, required: true },
        reason: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        ret._id = ret._id.toString();
        delete ret.likes;
        delete ret.reports;
        delete ret.__v;
        return ret;
      },
    },
  }
);

CommunityPostSchema.index({ status: 1, createdAt: -1 });
CommunityPostSchema.index({ tags: 1 });
CommunityPostSchema.index({ isPinned: -1, createdAt: -1 });

const CommunityCommentSchema = new Schema<ICommunityCommentDocument>(
  {
    postId: { type: String, required: true, index: true },
    authorId: { type: String, required: true },
    authorName: { type: String, required: true },
    authorAvatar: { type: String },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ['published', 'hidden', 'flagged'],
      default: 'published',
    },
    reports: [
      {
        reporterId: { type: String, required: true },
        reason: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        ret._id = ret._id.toString();
        delete ret.reports;
        delete ret.__v;
        return ret;
      },
    },
  }
);

CommunityCommentSchema.index({ postId: 1, createdAt: 1 });

export const CommunityPostModel: Model<ICommunityPostDocument> =
  mongoose.models.CommunityPost ??
  mongoose.model<ICommunityPostDocument>('CommunityPost', CommunityPostSchema);

export const CommunityCommentModel: Model<ICommunityCommentDocument> =
  mongoose.models.CommunityComment ??
  mongoose.model<ICommunityCommentDocument>('CommunityComment', CommunityCommentSchema);
