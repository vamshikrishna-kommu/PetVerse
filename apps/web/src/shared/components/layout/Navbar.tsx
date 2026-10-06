import { useNavigate } from 'react-router-dom';
import {
  Search,
  Menu,
  Sun,
  Moon,
  LogOut,
  User,
  Settings,
  ChevronDown,
  Bell,
  PawPrint,
  ShoppingBag,
  MapPin,
  MessageSquare,
  AlertTriangle,
  Stethoscope,
  Scan,
  Flame,
  X,
  ArrowRight,
} from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/app/store/auth.store';
import { useUIStore } from '@/app/store/ui.store';
import { useNotificationFeed, useUnreadCount, useMarkNotificationRead } from '@/features/notifications/hooks/useNotifications';
import { cn, getInitials, stringToColor } from '@/shared/utils/cn';

interface SearchShortcut {
  title: string;
  category: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const STATIC_SEARCH_TARGETS: SearchShortcut[] = [
  { title: 'My Pets Directory', category: 'Pet Care', url: '/pets', icon: PawPrint },
  { title: 'Add New Pet Profile', category: 'Pet Care', url: '/pets/new', icon: PawPrint },
  { title: 'Pet Care Marketplace & Products', category: 'Shop', url: '/marketplace', icon: ShoppingBag },
  { title: 'Nearby Veterinary Clinics (Hyderabad)', category: 'Clinics', url: '/nearby', icon: MapPin },
  { title: 'Lost & Found Pet Registry', category: 'Community', url: '/lost-found', icon: AlertTriangle },
  { title: 'Community Pet Forum', category: 'Community', url: '/community', icon: MessageSquare },
  { title: 'Visual Breed Identifier AI', category: 'AI Tools', url: '/ai/breed-scan', icon: Scan },
  { title: 'AI Symptom Checker & Triage', category: 'AI Tools', url: '/ai/assistant', icon: Stethoscope },
  { title: 'Emergency Hospital Finder', category: 'Emergency', url: '/emergency', icon: Flame, badge: '24/7' },
  { title: 'My Profile & Records', category: 'Account', url: '/profile', icon: User },
];

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { theme, setTheme, toggleSidebar } = useUIStore();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const { data: unreadCount } = useUnreadCount();
  const { data: notifications } = useNotificationFeed();
  const markRead = useMarkNotificationRead();

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Global ⌘K / Ctrl+K keyboard shortcut
  useEffect(() => {
    function handleGlobalKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchFocused(true);
      } else if (e.key === 'Escape' && searchFocused) {
        setSearchFocused(false);
        searchInputRef.current?.blur();
      }
    }
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [searchFocused]);

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const fullName = user
    ? `${user.profile.firstName} ${user.profile.lastName}`
    : 'User';

  const avatarColor = stringToColor(fullName);

  // Filter shortcuts based on user query
  const filteredShortcuts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return STATIC_SEARCH_TARGETS.slice(0, 6);
    return STATIC_SEARCH_TARGETS.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;

    setSearchFocused(false);
    // Intelligent contextual routing based on query keywords
    const lower = q.toLowerCase();
    if (lower.includes('clinic') || lower.includes('vet') || lower.includes('hospital') || lower.includes('doctor')) {
      navigate(`/nearby?search=${encodeURIComponent(q)}`);
    } else if (lower.includes('food') || lower.includes('toy') || lower.includes('treat') || lower.includes('product') || lower.includes('collar') || lower.includes('shampoo')) {
      navigate(`/marketplace?search=${encodeURIComponent(q)}`);
    } else if (lower.includes('lost') || lower.includes('found') || lower.includes('missing')) {
      navigate(`/lost-found?search=${encodeURIComponent(q)}`);
    } else if (lower.includes('post') || lower.includes('discuss') || lower.includes('forum')) {
      navigate(`/community?search=${encodeURIComponent(q)}`);
    } else {
      // Default to pets search
      navigate(`/pets?search=${encodeURIComponent(q)}`);
    }
  };

  const handleSelectShortcut = (url: string) => {
    setSearchFocused(false);
    setSearchQuery('');
    navigate(url);
  };

  return (
    <header className="sticky top-0 z-30 flex h-navbar items-center gap-2 sm:gap-4 border-b border-border bg-surface/80 px-3 sm:px-6 backdrop-blur-xl">
      {/* Mobile menu toggle */}
      <button
        onClick={toggleSidebar}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground lg:hidden"
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Global Search Bar & Live Dropdown */}
      <div ref={searchContainerRef} className="relative flex flex-1 items-center min-w-0 max-w-md">
        <form
          onSubmit={handleSearchSubmit}
          className={cn(
            'relative flex w-full items-center gap-2 rounded-xl border bg-surface-2 px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm transition-all duration-200 min-w-0',
            searchFocused
              ? 'border-primary ring-2 ring-primary/20 shadow-glow bg-surface'
              : 'border-border hover:border-border-strong'
          )}
        >
          <Search className="h-4 w-4 shrink-0 text-muted" />
          <input
            ref={searchInputRef}
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pets, records, products, clinics…"
            onFocus={() => setSearchFocused(true)}
            className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm text-foreground placeholder:text-muted placeholder:truncate focus:outline-none"
            aria-label="Global search"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                searchInputRef.current?.focus();
              }}
              className="p-0.5 text-muted hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <kbd className="hidden rounded bg-surface-3 px-1.5 py-0.5 text-[10px] font-mono text-muted sm:block">
              ⌘K
            </kbd>
          )}
        </form>

        {/* Search Results Dropdown */}
        <AnimatePresence>
          {searchFocused && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-border bg-surface shadow-2xl shadow-black/15 overflow-hidden z-50 divide-y divide-border/60"
            >
              {/* Contextual Search Redirects when user is typing */}
              {searchQuery.trim() && (
                <div className="p-2 bg-primary/5">
                  <p className="px-3 py-1 text-[11px] font-semibold text-muted uppercase tracking-wider">
                    Search in category
                  </p>
                  <div className="grid grid-cols-2 gap-1 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchFocused(false);
                        navigate(`/pets?search=${encodeURIComponent(searchQuery.trim())}`);
                      }}
                      className="flex items-center gap-2 p-2 rounded-xl text-xs font-medium text-foreground hover:bg-surface-2 transition-colors text-left"
                    >
                      <PawPrint className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="truncate">Pets: "{searchQuery.trim()}"</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchFocused(false);
                        navigate(`/marketplace?search=${encodeURIComponent(searchQuery.trim())}`);
                      }}
                      className="flex items-center gap-2 p-2 rounded-xl text-xs font-medium text-foreground hover:bg-surface-2 transition-colors text-left"
                    >
                      <ShoppingBag className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span className="truncate">Store: "{searchQuery.trim()}"</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchFocused(false);
                        navigate(`/nearby?search=${encodeURIComponent(searchQuery.trim())}`);
                      }}
                      className="flex items-center gap-2 p-2 rounded-xl text-xs font-medium text-foreground hover:bg-surface-2 transition-colors text-left"
                    >
                      <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                      <span className="truncate">Clinics: "{searchQuery.trim()}"</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchFocused(false);
                        navigate(`/community?search=${encodeURIComponent(searchQuery.trim())}`);
                      }}
                      className="flex items-center gap-2 p-2 rounded-xl text-xs font-medium text-foreground hover:bg-surface-2 transition-colors text-left"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                      <span className="truncate">Community: "{searchQuery.trim()}"</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Navigation Shortcuts */}
              <div className="p-2 max-h-64 overflow-y-auto">
                <p className="px-3 py-1 text-[11px] font-semibold text-muted uppercase tracking-wider">
                  {searchQuery.trim() ? 'Matching Pages & Tools' : 'Quick Navigation'}
                </p>
                {filteredShortcuts.length === 0 ? (
                  <div className="py-6 text-center text-xs text-muted">
                    No matching tools found for "{searchQuery.trim()}"
                  </div>
                ) : (
                  <div className="space-y-0.5 mt-1">
                    {filteredShortcuts.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.url}
                          type="button"
                          onClick={() => handleSelectShortcut(item.url)}
                          className="flex items-center justify-between w-full p-2.5 rounded-xl text-left hover:bg-surface-2 transition-colors group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-1.5 rounded-lg bg-surface-3 text-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                              <Icon className="h-4 w-4 shrink-0" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                {item.title}
                              </p>
                              <p className="text-[10px] text-muted">{item.category}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {item.badge && (
                              <span className="badge text-[9px] px-1.5 py-0.5 bg-rose-500/10 text-rose-500 font-bold">
                                {item.badge}
                              </span>
                            )}
                            <ArrowRight className="h-3.5 w-3.5 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer hint */}
              <div className="p-2.5 bg-surface-2/60 text-center text-[11px] text-muted flex items-center justify-between px-4">
                <span>Press <strong className="text-foreground">Enter</strong> to search across all records</span>
                <span className="hidden sm:inline">ESC to dismiss</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
          aria-label="Toggle theme"
        >
          <AnimatePresence mode="wait">
            {theme === 'dark' ? (
              <motion.div
                key="sun"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                transition={{ duration: 0.15 }}
              >
                <Sun className="h-4 w-4" />
              </motion.div>
            ) : (
              <motion.div
                key="moon"
                initial={{ opacity: 0, rotate: 90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: -90 }}
                transition={{ duration: 0.15 }}
              >
                <Moon className="h-4 w-4" />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Notification bell */}
        <div ref={notificationRef} className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {(unreadCount ?? 0) > 0 && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger ring-2 ring-surface" />
            )}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-surface shadow-xl shadow-black/10 overflow-hidden z-50">
              <div className="p-4 border-b border-border flex justify-between items-center">
                <h3 className="text-sm font-bold text-foreground">Notifications</h3>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {notifications?.length === 0 ? (
                  <div className="p-8 text-center text-muted text-sm">No new notifications</div>
                ) : (
                  notifications?.map((notif: any) => (
                    <div 
                      key={notif._id} 
                      onClick={() => {
                        if (!notif.isRead) markRead.mutate(notif._id);
                      }}
                      className={cn(
                        "p-4 border-b border-border hover:bg-surface-2 cursor-pointer transition",
                        !notif.isRead && "bg-primary/5"
                      )}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="text-sm font-bold text-foreground">{notif.title}</h4>
                        {!notif.isRead && <span className="h-2 w-2 bg-primary rounded-full mt-1" />}
                      </div>
                      <p className="text-xs text-muted">{notif.body}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-2"
            aria-label="Profile menu"
            aria-expanded={profileOpen}
          >
            {/* Avatar */}
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
              style={
                user?.profile.avatar
                  ? undefined
                  : { backgroundColor: avatarColor }
              }
            >
              {user?.profile.avatar ? (
                <img
                  src={user.profile.avatar}
                  alt={fullName}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                getInitials(fullName)
              )}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-xs font-medium text-foreground">{fullName}</p>
              <p className="text-[10px] capitalize text-muted">{user?.role.replace('_', ' ')}</p>
            </div>
            <ChevronDown
              className={cn(
                'hidden h-3.5 w-3.5 text-muted transition-transform duration-200 sm:block',
                profileOpen && 'rotate-180'
              )}
            />
          </button>

          {/* Dropdown */}
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.12 }}
                className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-border bg-surface shadow-lg shadow-black/10"
              >
                <div className="border-b border-border p-3">
                  <p className="text-sm font-medium text-foreground">{fullName}</p>
                  <p className="text-xs text-muted">{user?.email}</p>
                </div>
                <div className="p-1.5">
                  <DropdownItem icon={User} label="Profile" onClick={() => { navigate('/profile'); setProfileOpen(false); }} />
                  <DropdownItem icon={Settings} label="Settings" onClick={() => { navigate('/settings'); setProfileOpen(false); }} />
                </div>
                <div className="border-t border-border p-1.5">
                  <DropdownItem icon={LogOut} label="Sign out" onClick={handleLogout} danger />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

function DropdownItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
        danger
          ? 'text-danger hover:bg-danger/10'
          : 'text-foreground-2 hover:bg-surface-2 hover:text-foreground'
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
