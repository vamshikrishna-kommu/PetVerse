import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  PawPrint,
  Bell,
  CalendarDays,
  MapPin,
  AlertTriangle,
  Users,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Bot,
  Sparkles,
  Zap,
  Activity,
  BarChart3,
  Flame,
  User,
  Scan,
  UtensilsCrossed,
  Stethoscope,
  Plus,
  DollarSign,
  MessageSquare,
  ShoppingBag,
  Heart,
  X,
} from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { useUIStore } from '@/app/store/ui.store';
import { useAuthStore } from '@/app/store/auth.store';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const BASE_NAV_GROUPS: NavGroup[] = [
  {
    group: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    group: 'Pet Care',
    items: [
      { label: 'All Pets', href: '/pets', icon: PawPrint },
      { label: 'Add New Pet', href: '/pets/new', icon: Plus },
      { label: 'Lost & Found', href: '/lost-found', icon: AlertTriangle },
    ],
  },
  {
    group: 'Schedule & Care',
    items: [
      { label: 'Reminders', href: '/reminders', icon: Bell },
      { label: 'Appointments', href: '/appointments', icon: CalendarDays },
      { label: 'Nearby Clinics', href: '/nearby', icon: MapPin },
      { label: 'Expense Tracker', href: '/expenses', icon: DollarSign },
    ],
  },
  {
    group: 'Community & Commerce',
    items: [
      { label: 'Community Feed', href: '/community', icon: MessageSquare },
      { label: 'Marketplace', href: '/marketplace', icon: ShoppingBag },
      { label: 'Adoption Sanctuary', href: '/adoption', icon: Heart },
    ],
  },
  {
    group: 'AI Veterinary Hub',
    items: [
      { label: 'AI Overview', href: '/ai', icon: Sparkles },
      { label: 'Symptom Triage', href: '/ai/assistant', icon: Stethoscope },
      { label: 'Breed Identifier', href: '/ai/breed-scan', icon: Scan },
      { label: 'Diet Recommendations', href: '/ai/diet', icon: UtensilsCrossed },
    ],
  },
  {
    group: 'Safety & System',
    items: [
      { label: 'Emergency Center', href: '/emergency', icon: Flame },
      { label: 'My Profile', href: '/profile', icon: User },
      { label: 'Account Settings', href: '/settings', icon: Settings },
    ],
  },
];

const ADMIN_NAV_GROUP: NavGroup = {
  group: 'Admin Portal',
  items: [
    { label: 'Admin Telemetry', href: '/admin', icon: ShieldCheck },
    { label: 'User Directory', href: '/admin/users', icon: Users },
    { label: 'Automation Rules', href: '/admin/automation', icon: Zap },
    { label: 'Event Monitor', href: '/admin/events', icon: Activity },
    { label: 'Push Analytics', href: '/admin/notifications', icon: BarChart3 },
  ],
};

export default function Sidebar() {
  const { sidebarOpen, sidebarCollapsed, toggleSidebarCollapsed, setSidebarOpen } = useUIStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const navGroups = user?.role === 'admin'
    ? [...BASE_NAV_GROUPS, ADMIN_NAV_GROUP]
    : BASE_NAV_GROUPS;

  const effectiveCollapsed = isMobile ? false : sidebarCollapsed;

  return (
    <motion.aside
      animate={{ width: effectiveCollapsed ? 68 : 280 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className={cn(
        'fixed left-0 top-0 z-50 flex h-full flex-col border-r border-border bg-surface shadow-sm',
        'lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Logo & Mobile Close */}
      <div 
        className="flex h-navbar items-center justify-between border-b border-border px-4"
      >
        <div 
          onClick={() => {
            navigate('/dashboard');
            if (isMobile) setSidebarOpen(false);
          }}
          className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary shadow-md shadow-primary/30">
            <PawPrint className="h-5 w-5 text-white" />
          </div>
          <AnimatePresence>
            {!effectiveCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden"
              >
                <p className="text-sm font-bold text-foreground">PetVerse</p>
                <p className="text-xs text-muted">Pet Care Ecosystem</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground lg:hidden"
          aria-label="Close navigation"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-hide px-3 py-4 space-y-4">
        {navGroups.map((group) => (
          <div key={group.group} className="mb-4">
            {!effectiveCollapsed && (
              <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-wider text-muted/70">
                {group.group}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <SidebarLink 
                  key={item.href + item.label} 
                  item={item} 
                  collapsed={effectiveCollapsed}
                  onItemClick={() => {
                    if (isMobile) setSidebarOpen(false);
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Collapse toggle (Desktop only) */}
      <div className="hidden border-t border-border p-3 lg:block">
        <button
          onClick={toggleSidebarCollapsed}
          className="flex w-full items-center justify-center rounded-lg p-2 text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <div className="flex w-full items-center justify-between px-1">
              <span className="text-xs">Collapse</span>
              <ChevronLeft className="h-4 w-4" />
            </div>
          )}
        </button>
      </div>
    </motion.aside>
  );
}

function SidebarLink({
  item,
  collapsed,
  onItemClick,
}: {
  item: NavItem;
  collapsed: boolean;
  onItemClick?: () => void;
}) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.href}
      title={collapsed ? item.label : undefined}
      onClick={onItemClick}
      className={({ isActive }) =>
        cn(
          'relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150',
          isActive
            ? 'bg-primary/10 text-primary font-semibold'
            : 'text-foreground/70 hover:bg-surface-2 hover:text-foreground',
          collapsed && 'justify-center px-2'
        )
      }
    >
      <Icon className="h-[18px] w-[18px] shrink-0" />
      <AnimatePresence>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="truncate text-xs"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
      {item.badge !== undefined && item.badge > 0 && (
        <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
          {item.badge > 99 ? '99+' : item.badge}
        </span>
      )}
    </NavLink>
  );
}

