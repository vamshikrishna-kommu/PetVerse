import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePet } from '@/features/pets/hooks/usePets';
import {
  useGrowthLogs,
  useGrowthAnalytics,
  useCreateGrowthLog,
  useDeleteGrowthLog,
} from '../hooks/useGrowth';
import {
  ArrowLeft,
  Plus,
  Weight,
  Ruler,
  TrendingUp,
  Calendar,
  Trash2,
  Activity,
  PawPrint,
  X,
} from 'lucide-react';
import { Skeleton } from '@/shared/components/feedback/Skeleton';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function PetGrowthPage() {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();

  const { data: pet } = usePet(petId as string);
  const { data: logs, isLoading: isLoadingLogs } = useGrowthLogs(petId as string);
  const { data: analytics, isLoading: isLoadingAnalytics } = useGrowthAnalytics(petId as string);

  const createLog = useCreateGrowthLog(petId as string);
  const deleteLog = useDeleteGrowthLog(petId as string);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    weight: '',
    height: '',
    length: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.weight && !formData.height) {
      toast.error('Please enter at least weight or height');
      return;
    }

    createLog.mutate(
      {
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
        length: formData.length ? parseFloat(formData.length) : undefined,
        notes: formData.notes,
        date: formData.date,
      },
      {
        onSuccess: () => {
          toast.success('Growth measurement logged!');
          setIsModalOpen(false);
          setFormData({
            weight: '',
            height: '',
            length: '',
            notes: '',
            date: new Date().toISOString().split('T')[0],
          });
        },
        onError: (err: any) => {
          toast.error(err.response?.data?.error?.message || 'Failed to log measurement');
        },
      }
    );
  };

  const handleDelete = (growthId: string) => {
    if (window.confirm('Delete this growth measurement?')) {
      deleteLog.mutate(growthId, {
        onSuccess: () => toast.success('Measurement deleted'),
        onError: () => toast.error('Failed to delete measurement'),
      });
    }
  };

  if (isLoadingLogs || isLoadingAnalytics) {
    return (
      <div className="container-page py-8">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  // Format data for Recharts (sorted chronologically)
  const chartData = [...(logs || [])]
    .sort((a, b) => new Date(a.date || (a as any).recordedAt).getTime() - new Date(b.date || (b as any).recordedAt).getTime())
    .map((l) => ({
      date: new Date(l.date || (l as any).recordedAt).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
      }),
      weight: l.weight,
      height: l.height,
    }));

  return (
    <div className="container-page py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate(`/pets/${petId}`)}
            className="flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="h-4 w-4" /> Back to {pet?.name || 'Pet'} Profile
          </button>
          <h1 className="text-3xl font-bold text-foreground">
            Growth & Weight Tracker — {pet?.name}
          </h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-primary/90 transition-all"
        >
          <Plus className="h-4 w-4" /> Log Measurement
        </button>
      </div>

      {/* Analytics Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card p-5 bg-surface border-border flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Weight className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Current Weight</p>
            <p className="text-2xl font-bold text-foreground">
              {analytics?.currentWeight ? `${analytics.currentWeight} kg` : 'N/A'}
            </p>
          </div>
        </div>

        <div className="card p-5 bg-surface border-border flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Weight Change</p>
            <p className="text-2xl font-bold text-foreground">
              {analytics?.weightChange !== undefined
                ? `${analytics.weightChange >= 0 ? '+' : ''}${analytics.weightChange} kg (${analytics.percentageChange}%)`
                : 'N/A'}
            </p>
          </div>
        </div>

        <div className="card p-5 bg-surface border-border flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
            <Ruler className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Current Height</p>
            <p className="text-2xl font-bold text-foreground">
              {analytics?.currentHeight ? `${analytics.currentHeight} cm` : 'N/A'}
            </p>
          </div>
        </div>

        <div className="card p-5 bg-surface border-border flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center text-success">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted uppercase tracking-wider">Measurements</p>
            <p className="text-2xl font-bold text-foreground">{analytics?.measurementCount || 0}</p>
          </div>
        </div>
      </div>

      {/* Recharts Weight Trend Section */}
      <div className="card p-6 mb-8">
        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" /> Weight History Trend
        </h2>

        {!logs || logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <PawPrint className="h-16 w-16 text-muted mb-4 opacity-40" />
            <h3 className="text-lg font-bold text-foreground">No growth measurements yet</h3>
            <p className="text-sm text-muted mt-1 mb-6">
              Track {pet?.name}'s weight and height over time to monitor healthy growth.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
            >
              Add First Measurement
            </button>
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="date" stroke="#888888" fontSize={12} />
                <YAxis stroke="#888888" fontSize={12} unit=" kg" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    borderColor: '#374151',
                    borderRadius: '0.75rem',
                    color: '#fff',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  name="Weight (kg)"
                  stroke="var(--color-primary, #6366f1)"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Log History Table */}
      {logs && logs.length > 0 && (
        <div className="card overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-xl font-bold text-foreground">Measurement History</h2>
          </div>
          <div className="divide-y divide-border">
            {logs.map((log) => (
              <div
                key={log._id}
                className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-2/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {new Date(log.date || (log as any).recordedAt).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <div className="flex gap-4 text-sm text-muted mt-0.5">
                      {log.weight && <span>Weight: <strong className="text-foreground">{log.weight} kg</strong></span>}
                      {log.height && <span>Height: <strong className="text-foreground">{log.height} cm</strong></span>}
                    </div>
                    {log.notes && <p className="text-xs text-muted mt-1 italic">"{log.notes}"</p>}
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(log._id)}
                  className="p-2 text-muted hover:text-danger rounded-lg transition-colors self-end sm:self-center"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Measurement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="card max-w-md w-full p-6 relative bg-surface border-border shadow-2xl rounded-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-muted hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 className="text-xl font-bold text-foreground mb-4">Log Growth Measurement</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 12.5"
                  value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  Height (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 45"
                  value={formData.height}
                  onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                  Notes / Observations
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Healthy appetite, active behavior"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input w-full"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-surface-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLog.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
                >
                  {createLog.isPending ? 'Saving...' : 'Save Measurement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}