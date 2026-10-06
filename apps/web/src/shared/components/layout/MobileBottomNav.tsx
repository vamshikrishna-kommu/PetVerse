import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PawPrint, Sparkles, Flame, Menu } from 'lucide-react';
import { useUIStore } from '@/app/store/ui.store';
import { cn } from '@/shared/utils/cn';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  isSpecial?: boolean;
}

const BOTTOM_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Pets', href: '/pets', icon: PawPrint },
  { label: 'AI Hub', href: '/ai', icon: Sparkles, isSpecial: true },
  { label: 'Emergency', href: '/emergency', icon: Flame },
];

export default function MobileBottomNav() {
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useUIStore();

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-border bg-surface/90 backdrop-blur-xl shadow-lg pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="flex items-center justify-around px-2 py-1.5 h-16">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const Icon = item.icon;

          if (item.isSpecial) {
            return (
              <NavLink
                key={item.href}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'relative -top-3 flex flex-col items-center justify-center',
                    'transition-all duration-200 active:scale-95 focus:outline-none'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={cn(
                        'flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform duration-200',
                        isActive
                          ? 'bg-gradient-to-tr from-primary to-accent text-white scale-105 shadow-primary/40 ring-4 ring-surface'
                          : 'bg-gradient-to-tr from-primary/90 to-accent/90 text-white shadow-primary/20'
                      )}
                    >
                      <Icon className="h-6 w-6 animate-pulse" />
                    </div>
                    <span
                      className={cn(
                        'text-[9px] sm:text-[10px] font-semibold mt-0.5 sm:mt-1 transition-colors truncate max-w-full',
                        isActive ? 'text-primary font-bold' : 'text-muted'
                      )}
                    >
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center justify-center py-1 transition-all duration-150 active:scale-95 min-w-0',
                  isActive
                    ? 'text-primary font-semibold'
                    : 'text-muted hover:text-foreground'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <Icon className="h-5 w-5" />
                    {isActive && (
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
                    )}
                  </div>
                  <span className="text-[9px] sm:text-[10px] mt-0.5 sm:mt-1 tracking-tight truncate max-w-full text-center">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}

        {/* Menu Toggle button */}
        <button
          onClick={toggleSidebar}
          aria-label="Toggle Navigation Drawer"
          className={cn(
            'flex flex-1 flex-col items-center justify-center py-1 transition-all duration-150 active:scale-95 min-w-0',
            sidebarOpen ? 'text-primary font-semibold' : 'text-muted hover:text-foreground'
          )}
        >
          <div className="relative">
            <Menu className="h-5 w-5" />
            {sidebarOpen && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
            )}
          </div>
          <span className="text-[9px] sm:text-[10px] mt-0.5 sm:mt-1 tracking-tight truncate max-w-full text-center">
            More
          </span>
        </button>
      </div>
    </nav>
  );
}
