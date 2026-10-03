import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Search,
  Filter,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Flag,
  MapPin,
  Clock,
} from 'lucide-react';
import { adminApi } from '../api/adminApi';
import { toast } from 'sonner';

export default function AdminLostFoundPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');

  const loadReports = () => {
    setIsLoading(true);
    adminApi
      .listLostFoundReports({
        reportType: typeFilter !== 'all' ? typeFilter : undefined,
      })
      .then((data) => {
        setReports(data.reports || []);
      })
      .catch((err) => console.error('Failed to load lost/found reports', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadReports();
  }, [typeFilter]);

  const handleModerate = async (id: string, status: string) => {
    try {
      await adminApi.moderateLostFoundReport(id, status);
      toast.success(`Report status updated to ${status}`);
      loadReports();
    } catch {
      toast.error('Failed to update report status');
    }
  };

  return (
    <div className="container-page max-w-7xl py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-4 flex items-center justify-between">
        <div>
          <Link
            to="/admin"
            className="text-xs text-muted hover:text-foreground inline-flex items-center gap-1 mb-2 font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-8 h-8 text-amber-500" /> Lost & Found Moderation
          </h1>
          <p className="text-muted text-sm mt-1">
            Review community lost pet bulletins, verified finder reports, and moderate flagged notices.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card p-4 border-border flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-muted">Type:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input py-1.5 px-3 text-xs capitalize"
          >
            <option value="all">All Bulletins</option>
            <option value="lost">Lost Reports</option>
            <option value="found">Found Reports</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="card border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-2 text-muted border-b border-border uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Pet / Description</th>
                <th className="py-3 px-4">Species & Breed</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Moderation</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {reports.map((r) => (
                <tr key={r._id} className="hover:bg-surface-2/60 transition">
                  <td className="py-3 px-4 text-muted whitespace-nowrap">
                    {r.lastSeenDate ? new Date(r.lastSeenDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`badge text-[10px] font-bold uppercase tracking-wider ${
                        r.reportType === 'lost'
                          ? 'bg-red-500/10 text-red-600 border border-red-500/20'
                          : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                      }`}
                    >
                      {r.reportType}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-foreground">{r.petName || 'Unknown Animal'}</div>
                    <div className="text-muted text-[11px] line-clamp-1 max-w-xs">
                      {r.description}
                    </div>
                  </td>
                  <td className="py-3 px-4 capitalize">
                    <div className="font-semibold text-foreground">{r.species}</div>
                    <div className="text-muted text-[11px]">{r.breed || 'Mixed'}</div>
                  </td>
                  <td className="py-3 px-4 text-muted">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                      <span className="truncate max-w-[150px]">{r.locationName || 'Location tag'}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`badge text-[10px] font-semibold uppercase ${
                        r.moderationStatus === 'flagged'
                          ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          : 'bg-surface-3 text-muted'
                      }`}
                    >
                      {r.moderationStatus || 'approved'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleModerate(r._id, 'approved')}
                        className="p-1 hover:text-emerald-500 text-muted transition"
                        title="Approve report"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleModerate(r._id, 'flagged')}
                        className="p-1 hover:text-amber-500 text-muted transition"
                        title="Flag report"
                      >
                        <Flag className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleModerate(r._id, 'removed')}
                        className="p-1 hover:text-danger text-muted transition"
                        title="Remove report"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {reports.length === 0 && !isLoading && (
          <div className="py-16 text-center space-y-3">
            <AlertTriangle className="w-12 h-12 text-muted mx-auto opacity-40" />
            <h3 className="text-base font-bold text-foreground">No Bulletins</h3>
            <p className="text-xs text-muted max-w-sm mx-auto">
              There are currently no lost or found notices matching this filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
