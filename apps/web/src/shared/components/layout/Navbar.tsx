import { useNavigate } from 'react-router-dom';
import { Search, Menu, Sun, Moon, LogOut, User, Settings, ChevronDown, Bell } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/app/store/auth.store';
import { useUIStore } from '@/app/store/ui.store';
import { useNotificationFeed, useUnreadCount, useMarkNotificationRead } from '@/features/notifications/hooks/useNotifications';
import { cn, getInitials, stringToColor } from '@/shared/utils/cn';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { theme, setTheme, toggleSidebar } = useUIStore();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  
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
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const fullName = user
    ? `${user.profile.firstName} ${user.profile.lastName}`
    : 'User';

  const avatarColor = stringToColor(fullName);

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

      {/* Search */}
      <div className="flex flex-1 items-center min-w-0">
        <div
          className={cn(
            'relative flex max-w-sm flex-1 items-center gap-2 rounded-lg border bg-surface-2 px-2.5 py-1.5 sm:px-3 sm:py-2 text-sm transition-all duration-200 min-w-0',
            searchFocused
              ? 'border-primary shadow-glow'
              : 'border-border hover:border-border-strong'
          )}
        >
          <Search className="h-4 w-4 shrink-0 text-muted" />
          <input
            type="search"
            placeholder="Search pets, records, products…"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm text-foreground placeholder:text-muted placeholder:truncate focus:outline-none"
            aria-label="Global search"
          />
          <kbd className="hidden rounded bg-surface-3 px-1.5 py-0.5 text-[10px] font-mono text-muted sm:block">
            ⌘K
          </kbd>
        </div>
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
