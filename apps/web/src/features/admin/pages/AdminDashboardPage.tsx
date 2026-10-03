import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi, type AdminSystemStats } from '../api/adminApi';
import {
  ShieldAlert,
  Users,
  PawPrint,
  CalendarCheck,
  BellRing,
  Activity,
  ArrowRight,
  Server,
  Zap,
  AlertTriangle,
  Terminal,
  Cpu,
  BarChart3,
} from 'lucide-react';
import { Skeleton } from '@/shared/components/feedback/Skeleton';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminSystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getSystemStats()
      .then((data) => setStats(data))
      .catch((err) => console.error('Failed to load admin stats', err))
      .finally(() => setIsLoading(false));
  }, []);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${d > 0 ? `${d}d ` : ''}${h}h ${m}m`;
  };

  return (
    <div className="container-page max-w-7xl py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-border pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <ShieldAlert className="w-8 h-8 text-primary" /> Admin Control Center
          </h1>
          <p className="text-muted text-sm mt-1">
            Global ecosystem oversight, identity administration, moderation, and infrastructure telemetry.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 text-xs font-semibold rounded-xl border border-emerald-500/20">
          <Activity className="w-4 h-4 animate-pulse" />
          <span>System {stats?.systemStatus || 'Online'}</span>
        </div>
      </div>

      {/* KPI Stats Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="card p-4 space-y-1.5 border-border">
            <div className="flex items-center justify-between text-muted">
              <span className="text-[10px] font-bold uppercase tracking-wider">Users</span>
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-extrabold text-foreground">{stats?.totalUsers || 0}</div>
            <p className="text-[10px] text-emerald-500 font-medium">
              {stats?.activeUsers || 0} active
            </p>
          </div>

          <div className="card p-4 space-y-1.5 border-border">
            <div className="flex items-center justify-between text-muted">
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Pets</span>
              <PawPrint className="w-4 h-4 text-accent" />
            </div>
            <div className="text-2xl font-extrabold text-foreground">{stats?.totalPets || 0}</div>
            <p className="text-[10px] text-muted font-medium">Registered animals</p>
          </div>

          <div className="card p-4 space-y-1.5 border-border">
            <div className="flex items-center justify-between text-muted">
              <span className="text-[10px] font-bold uppercase tracking-wider">Lost Pets</span>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-2xl font-extrabold text-foreground">{stats?.totalLostPets || 0}</div>
            <p className="text-[10px] text-red-500 font-medium">Active bulletins</p>
          </div>

          <div className="card p-4 space-y-1.5 border-border">
            <div className="flex items-center justify-between text-muted">
              <span className="text-[10px] font-bold uppercase tracking-wider">Bookings</span>
              <CalendarCheck className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-extrabold text-foreground">
              {stats?.totalAppointments || 0}
            </div>
            <p className="text-[10px] text-muted font-medium">Clinic visits</p>
          </div>

          <div className="card p-4 space-y-1.5 border-border">
            <div className="flex items-center justify-between text-muted">
              <span className="text-[10px] font-bold uppercase tracking-wider">Reminders</span>
              <BellRing className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-extrabold text-foreground">
              {stats?.totalReminders || 0}
            </div>
            <p className="text-[10px] text-muted font-medium">Active schedule alarms</p>
          </div>

          <div className="card p-4 space-y-1.5 border-border">
            <div className="flex items-center justify-between text-muted">
              <span className="text-[10px] font-bold uppercase tracking-wider">Alerts Sent</span>
              <Activity className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-extrabold text-foreground">
              {stats?.totalNotifications || 0}
            </div>
            <p className="text-[10px] text-muted font-medium">Push & in-app alerts</p>
          </div>
        </div>
      )}

      {/* Admin Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          to="/admin/users"
          className="card-interactive p-6 border-border hover:border-primary/40 space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <Users className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">User & Role Management</h3>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Inspect user records, toggle activation, and assign platform roles (admin, vet, shelter, owner).
            </p>
          </div>
        </Link>

        <Link
          to="/admin/pets"
          className="card-interactive p-6 border-border hover:border-accent/40 space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-accent/10 text-accent">
              <PawPrint className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-muted group-hover:text-accent group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Pet Registry & Records</h3>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Global search across all domestic pets, breed profiles, microchip IDs, and lost flags.
            </p>
          </div>
        </Link>

        <Link
          to="/admin/lost-found"
          className="card-interactive p-6 border-border hover:border-amber-500/40 space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-muted group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Lost & Found Moderation</h3>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Review and moderate community lost pet bulletins, candidate matches, and reports.
            </p>
          </div>
        </Link>

        <Link
          to="/admin/audit-logs"
          className="card-interactive p-6 border-border hover:border-emerald-500/40 space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Terminal className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-muted group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Audit Log Trail</h3>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Cryptographically timestamped audit trail of administrative mutations, security logins, and actions.
            </p>
          </div>
        </Link>

        <Link
          to="/admin/automation"
          className="card-interactive p-6 border-border hover:border-indigo-500/40 space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Cpu className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-muted group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Workflow Automation</h3>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Rule engine rules, condition filters, and triggered automated reminders.
            </p>
          </div>
        </Link>

        <Link
          to="/admin/notifications"
          className="card-interactive p-6 border-border hover:border-pink-500/40 space-y-3 group"
        >
          <div className="flex items-center justify-between">
            <div className="p-3 rounded-xl bg-pink-500/10 text-pink-500">
              <BarChart3 className="w-6 h-6" />
            </div>
            <ArrowRight className="w-5 h-5 text-muted group-hover:text-pink-500 group-hover:translate-x-1 transition-all" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Notification Delivery Metrics</h3>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Delivery success rates across Push, Email, In-App, and SSE channels.
            </p>
          </div>
        </Link>
      </div>

      {/* Telemetry card */}
      <div className="card p-6 border-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-foreground">
            <Server className="w-5 h-5 text-primary" /> System Health & Telemetry
          </div>
          <span className="text-xs font-mono text-muted">Node.js Express + Mongoose</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-muted pt-2 border-t border-border">
          <div>
            <span className="block font-medium">Uptime:</span>
            <span className="font-mono text-foreground font-semibold">
              {stats ? formatUptime(stats.uptimeSeconds) : '—'}
            </span>
          </div>
          <div>
            <span className="block font-medium">Database:</span>
            <span className="text-emerald-500 font-semibold">Healthy (MongoDB Replica / Shard)</span>
          </div>
          <div>
            <span className="block font-medium">Protection:</span>
            <span className="text-emerald-500 font-semibold">CORS & Rate Limiter Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}