import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Heart,
  MessageSquare,
  Share2,
  Trash2,
  Flag,
  Send,
  Clock,
  PawPrint,
  User,
} from 'lucide-react';
import {
  useCommunityPost,
  usePostComments,
  useToggleLike,
  useCreateComment,
  useDeleteComment,
  useDeletePost,
} from '../hooks/useCommunity';
import { useAuthStore } from '@/app/store/auth.store';
import { toast } from 'sonner';

export default function CommunityPostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [commentText, setCommentText] = useState('');

  const { data: post, isLoading: postLoading } = useCommunityPost(postId || '');
  const { data: comments, isLoading: commentsLoading } = usePostComments(postId || '');

  const toggleLikeMutation = useToggleLike();
  const createCommentMutation = useCreateComment();
  const deleteCommentMutation = useDeleteComment();
  const deletePostMutation = useDeletePost();

  const handleToggleLike = async () => {
    if (!user) {
      toast.error('Please log in to like stories');
      return;
    }
    if (!postId) return;
    try {
      await toggleLikeMutation.mutateAsync(postId);
    } catch {
      toast.error('Failed to like post');
    }
  };

  const handleCreateComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !postId) return;
    if (!user) {
      toast.error('Please log in to leave a comment');
      return;
    }

    try {
      await createCommentMutation.mutateAsync({
        postId,
        content: commentText.trim(),
      });
      setCommentText('');
      toast.success('Comment posted');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to post comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!postId) return;
    if (!window.confirm('Delete this comment?')) return;
    try {
      await deleteCommentMutation.mutateAsync({ commentId, postId });
      toast.success('Comment removed');
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const handleDeletePost = async () => {
    if (!postId) return;
    if (!window.confirm('Are you sure you want to permanently delete this post?')) return;
    try {
      await deletePostMutation.mutateAsync(postId);
      toast.success('Post deleted');
      navigate('/community');
    } catch {
      toast.error('Failed to delete post');
    }
  };

  if (postLoading) {
    return (
      <div className="container-page max-w-4xl py-12 text-center text-muted">
        Loading community discussion...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container-page max-w-4xl py-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-foreground">Post Not Found</h2>
        <p className="text-xs text-muted">This community story may have been deleted or hidden by moderation.</p>
        <Link to="/community" className="btn btn-primary text-xs inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Community
        </Link>
      </div>
    );
  }

  const isAuthor = user && (user._id === post.authorId || user.role === 'admin');

  return (
    <div className="container-page max-w-4xl py-8 space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/community"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-foreground transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Community Stories
        </Link>
      </div>

      {/* Main Post Card */}
      <div className="card p-6 md:p-8 border-border space-y-6 shadow-sm">
        {/* Author Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center overflow-hidden border border-border">
              {post.authorAvatar ? (
                <img src={post.authorAvatar} alt={post.authorName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-base">{post.authorName?.[0] || 'U'}</span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-foreground">{post.authorName}</span>
                {post.petName && (
                  <span className="badge bg-primary/10 text-primary border border-primary/20 text-xs font-semibold flex items-center gap-1">
                    <PawPrint className="w-3.5 h-3.5" /> {post.petName} ({post.petSpecies || 'Pet'})
                  </span>
                )}
              </div>
              <span className="text-xs text-muted flex items-center gap-1 mt-0.5">
                <Clock className="w-3.5 h-3.5" />
                {new Date(post.createdAt).toLocaleDateString(undefined, {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>

          {isAuthor && (
            <button
              onClick={handleDeletePost}
              className="btn btn-secondary text-xs text-danger hover:bg-danger/10 border-danger/20 flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Story
            </button>
          )}
        </div>

        {/* Title & Body */}
        <div className="space-y-4">
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground leading-tight">
            {post.title}
          </h1>

          <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
            {post.content}
          </p>
        </div>

        {/* Images */}
        {post.images && post.images.length > 0 && (
          <div className="rounded-2xl overflow-hidden border border-border">
            <img src={post.images[0]} alt="Story attachment" className="w-full h-auto object-cover max-h-[500px]" />
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {post.tags.map((t) => (
              <span
                key={t}
                className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-lg"
              >
                #{t}
              </span>
            ))}
          </div>
        )}

        {/* Social Reactions Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-4">
            <button
              onClick={handleToggleLike}
              className={`btn ${
                post.isLiked ? 'bg-red-500/10 text-red-500 border-red-500/30' : 'btn-secondary text-muted'
              } text-xs flex items-center gap-2`}
            >
              <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
              <span>{post.likesCount} Caretakers Liked</span>
            </button>

            <span className="text-xs text-muted flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" /> {comments?.length || 0} Comments
            </span>
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="card p-6 md:p-8 border-border space-y-6">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" /> Caretaker Discussions ({comments?.length || 0})
        </h2>

        {/* Comment Composer */}
        <form onSubmit={handleCreateComment} className="space-y-3">
          <textarea
            rows={3}
            placeholder={user ? "Write a helpful reply, advice, or words of encouragement..." : "Please log in to join the conversation..."}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            disabled={!user || createCommentMutation.isPending}
            className="input w-full resize-none text-xs"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!user || !commentText.trim() || createCommentMutation.isPending}
              className="btn btn-primary text-xs flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              {createCommentMutation.isPending ? 'Posting...' : 'Post Reply'}
            </button>
          </div>
        </form>

        {/* Comments List */}
        <div className="divide-y divide-border space-y-4 pt-4">
          {comments?.map((comment) => {
            const isCommentAuthor = user && (user._id === comment.authorId || user.role === 'admin');

            return (
              <div key={comment._id} className="pt-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface-3 text-primary text-xs font-bold flex items-center justify-center overflow-hidden border border-border flex-shrink-0 mt-0.5">
                    {comment.authorAvatar ? (
                      <img src={comment.authorAvatar} alt={comment.authorName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{comment.authorName?.[0] || 'U'}</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">{comment.authorName}</span>
                      <span className="text-[10px] text-muted">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/90 mt-1 leading-relaxed whitespace-pre-line">
                      {comment.content}
                    </p>
                  </div>
                </div>

                {isCommentAuthor && (
                  <button
                    onClick={() => handleDeleteComment(comment._id)}
                    className="p-1 text-muted hover:text-danger rounded transition"
                    title="Delete reply"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}

          {(!comments || comments.length === 0) && !commentsLoading && (
            <p className="text-xs text-muted text-center py-6">
              No replies yet. Be the first caretaker to chime in!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
