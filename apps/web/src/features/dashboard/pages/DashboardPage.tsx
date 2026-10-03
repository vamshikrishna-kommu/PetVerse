import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import {
  PawPrint, Heart, Syringe, Bell,
  ArrowRight, Plus, ChevronRight, CheckCircle2, AlertCircle, Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/app/store/auth.store';
import { usePets } from '@/features/pets/hooks/usePets';
import { useDashboardStats } from '@/features/dashboard/hooks/useDashboard';
import { useMyReminders } from '@/features/reminders/hooks/useReminders';
import { cn } from '@/shared/utils/cn';

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
};

const QUICK_ACTIONS = [
  { label: 'Add Pet', icon: PawPrint, href: '/pets/new', gradient: 'from-primary to-blue-400' },
  { label: 'View Reminders', icon: Bell, href: '/reminders', gradient: 'from-amber-500 to-orange-400' },
  { label: 'All Pets', icon: Heart, href: '/pets', gradient: 'from-accent to-purple-400' },
  { label: 'Health Center', icon: Syringe, href: '/pets', gradient: 'from-cyan-500 to-blue-500' },
];

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: petsResponse, isLoading: isPetsLoading } = usePets();
  const { data: stats, isLoading: isStatsLoading } = useDashboardStats();
  const { data: reminders } = useMyReminders();

  const pets = petsResponse?.data || [];

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const activeReminders = reminders?.filter((r) => r.isActive) || [];

  const statCards = [
    {
      label: 'My Pets',
      value: isStatsLoading ? '...' : (stats?.petCount ?? pets.length),
      icon: PawPrint,
      color: 'text-primary',
      bg: 'bg-primary/10',
      href: '/pets',
    },
    {
      label: 'Medical Records',
      value: isStatsLoading ? '...' : (stats?.medicalRecordCount ?? 0),
      icon: Heart,
      color: 'text-danger',
      bg: 'bg-danger/10',
      href: '/pets',
    },
    {
      label: 'Vaccinations',
      value: isStatsLoading ? '...' : (stats?.activeVaccinationCount ?? 0),
      icon: Syringe,
      color: 'text-success',
      bg: 'bg-success/10',
      href: '/pets',
    },
    {
      label: 'Reminders',
      value: isStatsLoading ? '...' : (stats?.pendingReminderCount ?? activeReminders.length),
      icon: Bell,
      color: 'text-warning',
      bg: 'bg-warning/10',
      href: '/reminders',
    },
  ];

  return (
    <div className="container-page space-y-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
            {greeting},{' '}
            <span className="text-gradient">{user?.profile.firstName ?? 'Pet Owner'}</span> 👋
          </h1>
          <p className="mt-1 text-sm text-muted">
            Here's what's happening with your pets today.
          </p>
        </div>
        <Link
          to="/pets/new"
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/30 transition-all hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Add Pet</span>
        </Link>
      </motion.div>

      {/* Stat Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
      >
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div key={card.label} variants={itemVariants}>
              <Link to={card.href}>
                <div className="card-interactive p-5">
                  <div className={cn('mb-3 inline-flex rounded-xl p-2.5', card.bg)}>
                    <Icon className={cn('h-5 w-5', card.color)} />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{card.value}</p>
                  <p className="text-sm text-muted">{card.label}</p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <motion.div key={action.label} variants={itemVariants}>
              <Link to={action.href}>
                <div
                  className={cn(
                    'relative flex items-center gap-3 overflow-hidden rounded-xl p-4 text-white shadow-md transition-all hover:opacity-90 hover:-translate-y-0.5',
                    `bg-gradient-to-r ${action.gradient}`
                  )}
                >
                  <Icon className="absolute -right-2 -bottom-2 h-16 w-16 opacity-10" />
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-semibold">{action.label}</span>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Main content grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Pet Access */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.35 }}
          className="lg:col-span-2"
        >
          <div className="card p-6">
            <div className="section-header mb-4">
              <h2 className="section-title">My Pets</h2>
              <Link
                to="/pets"
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {isPetsLoading ? (
              <div className="text-center py-6 text-sm text-muted">Loading pets...</div>
            ) : pets && pets.length > 0 ? (
              <div className="flex flex-col gap-3">
                {pets.slice(0, 5).map((pet) => (
                  <Link
                    key={pet._id}
                    to={`/pets/${pet._id}`}
                    className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-surface-2"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                      {pet.avatar ? (
                        <img src={pet.avatar} alt={pet.name} className="h-full w-full object-cover" />
                      ) : (
                        <PawPrint className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {pet.name}
                      </p>
                      <p className="text-xs text-muted">
                        {pet.breed ? `${pet.breed} • ${pet.species}` : pet.species}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-surface-2 px-2.5 py-1 text-xs font-medium text-muted">
                        Manage
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-surface-2 p-6 text-center">
                <PawPrint className="mx-auto h-8 w-8 text-muted/50 mb-2" />
                <p className="text-sm font-medium text-foreground">No pets added yet</p>
                <p className="text-xs text-muted mb-3">Add your first pet to start tracking health & reminders.</p>
                <Link to="/pets/new" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                  <Plus className="h-3.5 w-3.5" /> Add Pet
                </Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* Active Reminders Panel */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.35 }}
        >
          <div className="card p-6 h-full flex flex-col justify-between">
            <div>
              <div className="section-header mb-4">
                <h2 className="section-title">Upcoming Reminders</h2>
                <Link
                  to="/reminders"
                  className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {activeReminders.length > 0 ? (
                <div className="space-y-3">
                  {activeReminders.slice(0, 4).map((reminder) => (
                    <div
                      key={reminder._id}
                      className="flex items-start gap-3 rounded-lg border border-border p-3 bg-surface-2/50"
                    >
                      <div className="mt-0.5 rounded-lg bg-amber-500/10 p-1.5 text-amber-500">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground truncate">
                          {reminder.title}
                        </p>
                        {reminder.message && (
                          <p className="text-[11px] text-muted truncate">{reminder.message}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-surface-2/50 p-6 text-center">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500/70 mb-2" />
                  <p className="text-sm font-medium text-foreground">All caught up!</p>
                  <p className="text-xs text-muted">No pending reminders right now.</p>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <Link
                to="/reminders"
                className="flex items-center justify-center gap-2 rounded-xl bg-surface-2 py-2 text-xs font-medium text-foreground hover:bg-surface-3 transition-colors"
              >
                <Bell className="h-3.5 w-3.5 text-primary" />
                Manage All Reminders
              </Link>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Pet Vaccination Summary */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.35 }}
        className="card p-6"
      >
        <div className="section-header mb-4">
          <h2 className="section-title">Pet Overview & Health Status</h2>
          <Link to="/pets" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
            Manage Pets <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {pets.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {pets.map((pet) => (
              <Link
                key={pet._id}
                to={`/pets/${pet._id}/health`}
                className="rounded-xl border border-border p-4 transition-all hover:border-primary/50 hover:bg-surface-2"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10">
                    {pet.avatar ? (
                      <img src={pet.avatar} alt={pet.name} className="h-full w-full object-cover" />
                    ) : (
                      <PawPrint className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{pet.name}</p>
                    <p className="text-xs text-muted capitalize truncate">{pet.gender} • {pet.species}</p>
                  </div>
                  <span className="badge badge-success text-[11px]">Active</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-surface-2 p-6 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-muted/50 mb-2" />
            <p className="text-sm font-medium text-foreground">No pets registered</p>
            <p className="text-xs text-muted mb-3">Add pets to see their health and vaccination statuses.</p>
            <Link to="/pets/new" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              <Plus className="h-3.5 w-3.5" /> Add Pet
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
