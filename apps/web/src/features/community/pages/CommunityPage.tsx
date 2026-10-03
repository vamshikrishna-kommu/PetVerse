import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageSquare,
  Heart,
  Share2,
  Plus,
  Search,
  Filter,
  Trash2,
  Flag,
  PawPrint,
  Clock,
  Sparkles,
  Image as ImageIcon,
  Send,
  MoreVertical,
} from 'lucide-react';
import {
  useCommunityPosts,
  useCreatePost,
  useToggleLike,
  useDeletePost,
} from '../hooks/useCommunity';
import { useAuthStore } from '@/app/store/auth.store';
import { usePets } from '@/features/pets/hooks/usePets';
import type { IPet } from '@petverse/shared-types';
import { toast } from 'sonner';

const POPULAR_TAGS = ['all', 'wellness', 'nutrition', 'training', 'rescues', 'health', 'puppy', 'seniordogs'];

export default function CommunityPage() {
  const { user } = useAuthStore();
  const { data: petsData } = usePets();
  const pets: IPet[] = petsData?.data || [];

  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // Create form state
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    petId: '',
    tagInput: 'wellness',
    imageUrl: '',
  });

  const { data: postsData, isLoading } = useCommunityPosts({
    tag: selectedTag !== 'all' ? selectedTag : undefined,
    search: searchQuery.trim() || undefined,
  });

  const createPostMutation = useCreatePost();
  const toggleLikeMutation = useToggleLike();
  const deletePostMutation = useDeletePost();

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    try {
      await createPostMutation.mutateAsync({
        title: newPost.title.trim(),
        content: newPost.content.trim(),
        petId: newPost.petId || undefined,
        tags: [newPost.tagInput.toLowerCase().trim()],
        images: newPost.imageUrl ? [newPost.imageUrl.trim()] : [],
      });
      toast.success('Story published to the PetVerse community!');
      setShowCreateModal(false);
      setNewPost({ title: '', content: '', petId: '', tagInput: 'wellness', imageUrl: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to publish post');
    }
  };

  const handleToggleLike = async (postId: string) => {
    if (!user) {
      toast.error('Please log in to like stories');
      return;
    }
    try {
      await toggleLikeMutation.mutateAsync(postId);
    } catch {
      toast.error('Failed to update like');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this community post?')) return;
    try {
      await deletePostMutation.mutateAsync(postId);
      toast.success('Post removed');
    } catch {
      toast.error('Failed to delete post');
    }
  };

  const handleReportPost = async (postId: string) => {
    const reason = window.prompt('Please specify the reason for reporting this post (e.g. spam, misinformation):');
    if (!reason || !reason.trim()) return;
    try {
      const { communityApi } = await import('@/services/api/communityApi');
      await communityApi.reportPost(postId, reason);
      toast.success('Thank you. Post flagged for moderation review.');
    } catch {
      toast.error('Failed to submit report');
    }
  };

  return (
    <div className="container-page max-w-5xl py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-primary" /> PetVerse Community
          </h1>
          <p className="text-muted text-sm mt-1">
            Exchange advice, share wellness milestones, discuss veterinary experiences, and connect with fellow caretakers.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center gap-2 text-xs shadow-md shadow-primary/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Share a Story
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Tag pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 text-xs">
          {POPULAR_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 rounded-full capitalize font-medium transition whitespace-nowrap ${
                selectedTag === tag
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-surface-2 text-muted hover:bg-surface-3 hover:text-foreground'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search discussions, topics, advice..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input w-full pl-9 py-1.5 text-xs"
          />
        </div>
      </div>

      {/* Posts Stream */}
      <div className="space-y-6">
        {postsData?.posts?.map((post) => {
          const isAuthor = user && (user._id === post.authorId || user.role === 'admin');

          return (
            <div
              key={post._id}
              className="card p-6 border-border hover:border-primary/30 transition space-y-4 shadow-sm"
            >
              {/* Author & Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center overflow-hidden border border-border">
                    {post.authorAvatar ? (
                      <img src={post.authorAvatar} alt={post.authorName} className="w-full h-full object-cover" />
                    ) : (
                      <span>{post.authorName?.[0] || 'U'}</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{post.authorName}</span>
                      {post.petName && (
                        <span className="badge bg-primary/10 text-primary border border-primary/20 text-[10px] font-semibold flex items-center gap-1">
                          <PawPrint className="w-3 h-3" /> {post.petName} ({post.petSpecies || 'Pet'})
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-muted flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(post.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-muted">
                  <button
                    onClick={() => handleReportPost(post._id)}
                    className="p-1.5 hover:text-amber-500 rounded-lg transition"
                    title="Report post"
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </button>
                  {isAuthor && (
                    <button
                      onClick={() => handleDeletePost(post._id)}
                      className="p-1.5 hover:text-danger rounded-lg transition"
                      title="Delete post"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Post Title & Content */}
              <div className="space-y-2">
                <Link to={`/community/${post._id}`}>
                  <h2 className="text-lg font-bold text-foreground hover:text-primary transition">
                    {post.title}
                  </h2>
                </Link>
                <p className="text-xs text-muted leading-relaxed line-clamp-3 whitespace-pre-line">
                  {post.content}
                </p>
              </div>

              {/* Post Images if any */}
              {post.images && post.images.length > 0 && (
                <div className="rounded-xl overflow-hidden max-h-80 border border-border">
                  <img
                    src={post.images[0]}
                    alt="Post attachment"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {post.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] font-medium text-primary bg-primary/5 px-2 py-0.5 rounded-md"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {/* Action Toolbar */}
              <div className="flex items-center justify-between pt-3 border-t border-border text-xs">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleToggleLike(post._id)}
                    className={`flex items-center gap-1.5 font-semibold transition ${
                      post.isLiked ? 'text-red-500' : 'text-muted hover:text-red-500'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                    <span>{post.likesCount}</span>
                  </button>

                  <Link
                    to={`/community/${post._id}`}
                    className="flex items-center gap-1.5 font-semibold text-muted hover:text-primary transition"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{post.commentsCount} Comments</span>
                  </Link>
                </div>

                <Link
                  to={`/community/${post._id}`}
                  className="text-primary hover:text-primary-hover font-semibold text-xs flex items-center gap-1"
                >
                  Join Discussion →
                </Link>
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {(!postsData?.posts || postsData.posts.length === 0) && !isLoading && (
          <div className="card p-12 text-center border-border space-y-3">
            <MessageSquare className="w-12 h-12 text-muted mx-auto opacity-40" />
            <h3 className="text-base font-bold text-foreground">No Community Stories Found</h3>
            <p className="text-xs text-muted max-w-md mx-auto">
              Be the first to share an inspiring pet health story, training triumph, or nutrition question with the PetVerse family!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary text-xs inline-flex items-center gap-2 mt-2"
            >
              <Plus className="w-4 h-4" /> Share First Story
            </button>
          </div>
        )}
      </div>

      {/* CREATE POST MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card max-w-xl w-full p-6 border-border space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" /> Share a Pet Story or Tip
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-muted hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. How we managed Leo's seasonal allergies this spring"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Featured Pet (Optional)
                  </label>
                  <select
                    value={newPost.petId}
                    onChange={(e) => setNewPost({ ...newPost, petId: e.target.value })}
                    className="input w-full"
                  >
                    <option value="">General / None</option>
                    {pets.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.species})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Topic Category *
                  </label>
                  <select
                    value={newPost.tagInput}
                    onChange={(e) => setNewPost({ ...newPost, tagInput: e.target.value })}
                    className="input w-full capitalize"
                  >
                    <option value="wellness">Wellness & Vitality</option>
                    <option value="nutrition">Diet & Nutrition</option>
                    <option value="training">Behavior & Training</option>
                    <option value="rescues">Adoption & Rescues</option>
                    <option value="health">Health & Recovery</option>
                    <option value="puppy">Puppy & Kitten Care</option>
                    <option value="seniordogs">Senior Pet Comfort</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Story & Details *
                </label>
                <textarea
                  rows={5}
                  placeholder="Share details, symptoms observed, veterinarian guidance received, or advice that worked..."
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  className="input w-full resize-none text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Image Attachment URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newPost.imageUrl}
                  onChange={(e) => setNewPost({ ...newPost, imageUrl: e.target.value })}
                  className="input w-full text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createPostMutation.isPending}
                  className="btn btn-primary text-xs flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {createPostMutation.isPending ? 'Publishing...' : 'Publish Story'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
