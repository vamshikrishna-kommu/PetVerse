import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClinic, useClinicReviews, useAddReview } from '../hooks/useNearby';
import {
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  Globe,
  Clock,
  Star,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  MessageSquare,
  Plus,
  X,
} from 'lucide-react';
import { Skeleton } from '@/shared/components/feedback/Skeleton';
import { InteractiveMap } from '../components/InteractiveMap';
import { toast } from 'sonner';

export default function ProviderDetailPage() {
  const { providerId } = useParams<{ providerId: string }>();
  const navigate = useNavigate();

  const { data: clinic, isLoading } = useClinic(providerId as string);
  const { data: reviews } = useClinicReviews(providerId as string);
  const addReview = useAddReview(providerId as string);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error('Please write a review comment');
      return;
    }

    addReview.mutate(
      { rating, comment },
      {
        onSuccess: () => {
          toast.success('Review submitted successfully!');
          setIsReviewModalOpen(false);
          setComment('');
        },
        onError: () => toast.error('Failed to submit review'),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="container-page py-8">
        <Skeleton className="h-10 w-48 mb-6" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="container-page py-8 text-center">
        <h2 className="text-2xl font-bold">Provider Not Found</h2>
        <button
          onClick={() => navigate('/nearby')}
          className="mt-4 text-sm font-semibold text-primary"
        >
          Back to Nearby Services
        </button>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <button
        onClick={() => navigate('/nearby')}
        className="flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Nearby Services
      </button>

      {/* Main Header Card */}
      <div className="card p-6 sm:p-8 mb-8 bg-surface border-border shadow-xl rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="badge bg-primary/10 text-primary border-primary/20 capitalize">
              {clinic.type ? clinic.type.replace('_', ' ') : 'Service'}
            </span>
            {clinic.isVerified && (
              <span className="badge bg-success/10 text-success border-success/20 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Verified Provider
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{clinic.name}</h1>
          <p className="text-sm text-muted flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-muted" /> {clinic.address}
          </p>
        </div>

        <button
          onClick={() => navigate(`/appointments/book?clinicId=${clinic._id}`)}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-base font-semibold text-white shadow-lg hover:bg-primary/90 transition-all shrink-0"
        >
          <Calendar className="h-5 w-5" /> Book Appointment Here
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Services & Info */}
        <div className="lg:col-span-8 space-y-6">
          {/* Services offered */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Services Offered</h2>
            {clinic.services && clinic.services.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {clinic.services.map((s) => (
                  <span
                    key={s}
                    className="badge bg-surface-2 border border-border px-3 py-1.5 text-sm font-medium text-foreground"
                  >
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted">General veterinary care</p>
            )}
          </div>

          {/* Customer Reviews */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" /> Customer Reviews
              </h2>
              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                <Plus className="h-4 w-4" /> Leave Review
              </button>
            </div>

            {!reviews || reviews.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted">No reviews yet for this provider.</p>
                <button
                  onClick={() => setIsReviewModalOpen(true)}
                  className="mt-3 text-sm font-semibold text-primary hover:underline"
                >
                  Be the first to review
                </button>
              </div>
            ) : (
              <div className="space-y-4 divide-y divide-border">
                {reviews.map((r) => (
                  <div key={r._id} className="pt-4 first:pt-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-foreground">{r.userName}</p>
                      <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                        <Star className="h-3.5 w-3.5 fill-amber-500" />
                        {r.rating} / 5
                      </div>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{r.comment}</p>
                    <p className="text-xs text-muted mt-1">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Operating Info & Contact Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <div className="card p-6 space-y-4">
            <h3 className="text-lg font-bold text-foreground">Contact & Details</h3>

            {clinic.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <a href={`tel:${clinic.phone}`} className="text-foreground hover:underline">
                  {clinic.phone}
                </a>
              </div>
            )}

            {clinic.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <a href={`mailto:${clinic.email}`} className="text-foreground hover:underline">
                  {clinic.email}
                </a>
              </div>
            )}

            <div className="flex items-center gap-3 text-sm">
              <Star className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" />
              <span className="font-bold text-foreground">
                {clinic.ratings?.avg ? `${clinic.ratings.avg} / 5` : 'No reviews'}
              </span>
              {clinic.ratings?.count ? (
                <span className="text-muted">({clinic.ratings.count} reviews)</span>
              ) : null}
            </div>
          </div>

          {/* Location Map */}
          {clinic.location?.coordinates && (
            <div className="card p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" /> Clinic Location
              </h4>
              <InteractiveMap clinics={[clinic]} height="200px" />
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${clinic.location.coordinates[1]},${clinic.location.coordinates[0]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary w-full py-2 text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                Get Driving Directions
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="card max-w-md w-full p-6 relative bg-surface border-border shadow-2xl rounded-2xl">
            <button
              onClick={() => setIsReviewModalOpen(false)}
              className="absolute top-4 right-4 text-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold text-foreground mb-4">Write a Review</h2>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                  Rating (1 to 5 Stars)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= rating
                            ? 'text-amber-500 fill-amber-500'
                            : 'text-muted opacity-40'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  Your Review
                </label>
                <textarea
                  rows={4}
                  placeholder="Describe your experience with this provider..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="input w-full"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-surface-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addReview.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
                >
                  {addReview.isPending ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
