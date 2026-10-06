import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Clock,
  Terminal,
  User,
  ArrowLeft,
  FileText,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminApi, type AuditLogItem } from '../api/adminApi';
import { Skeleton } from '@/shared/components/feedback/Skeleton';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [selectedDetails, setSelectedDetails] = useState<Record<string, any> | null>(null);

  useEffect(() => {
    setIsLoading(true);
    adminApi
      .getAuditLogs({ action: actionFilter || undefined })
      .then((res) => setLogs(res.logs || []))
      .catch((err) => console.error('Failed to load audit logs', err))
      .finally(() => setIsLoading(false));
  }, [actionFilter]);

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
            <Terminal className="w-8 h-8 text-primary" /> Immutable Audit Trail
          </h1>
          <p className="text-muted text-sm mt-1">
            Cryptographically timestamped audit logging of administrative access, role changes, and moderation.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card p-4 border-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto text-xs">
          <Filter className="w-4 h-4 text-muted" />
          <span className="font-semibold text-muted">Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="input py-1.5 px-3 text-xs"
          >
            <option value="">All Actions</option>
            <option value="USER_ACTIVATED">USER_ACTIVATED</option>
            <option value="USER_DEACTIVATED">USER_DEACTIVATED</option>
            <option value="USER_ROLE_CHANGED">USER_ROLE_CHANGED</option>
            <option value="LOST_PET_FLAGGED">LOST_PET_FLAGGED</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="card border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-2 text-muted border-b border-border uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log) => (
                <tr key={log._id} className="hover:bg-surface-2/60 transition">
                  <td className="py-3 px-4 text-muted whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-semibold text-foreground">
                    {log.actorEmail}
                  </td>
                  <td className="py-3 px-4">
                    <span className="badge bg-primary/10 text-primary border border-primary/20 text-[10px] uppercase font-bold">
                      {log.actorRole}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-foreground">
                    {log.action}
                  </td>
                  <td className="py-3 px-4 text-muted">
                    {log.targetType} ({log.targetId.slice(-6)})
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-muted">
                    {log.ipAddress || '127.0.0.1'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {log.details ? (
                      <button
                        onClick={() => setSelectedDetails(log.details || null)}
                        className="text-primary hover:text-primary-hover font-semibold text-[11px]"
                      >
                        Inspect
                      </button>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {logs.length === 0 && !isLoading && (
          <div className="py-16 text-center space-y-3">
            <Terminal className="w-12 h-12 text-muted mx-auto opacity-40" />
            <h3 className="text-base font-bold text-foreground">No Audit Records Found</h3>
            <p className="text-xs text-muted max-w-sm mx-auto">
              No matching administrative actions have occurred within this audit window.
            </p>
          </div>
        )}
      </div>

      {/* JSON DETAILS MODAL */}
      {selectedDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="card max-w-md w-full p-6 border-border space-y-4 shadow-2xl max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> Audit Record Payload
              </h3>
              <button
                onClick={() => setSelectedDetails(null)}
                className="text-muted hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <pre className="p-4 bg-surface-3 rounded-xl text-xs font-mono text-foreground overflow-x-auto max-h-72">
              {JSON.stringify(selectedDetails, null, 2)}
            </pre>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedDetails(null)}
                className="btn btn-secondary text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
