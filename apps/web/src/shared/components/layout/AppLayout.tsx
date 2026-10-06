import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import MobileBottomNav from './MobileBottomNav';
import { useUIStore } from '@/app/store/ui.store';
import { useRealtimeNotifications } from '@/shared/hooks/useRealtimeNotifications';
import { cn } from '@/shared/utils/cn';

interface AppLayoutProps {
  children?: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  useRealtimeNotifications();
  const { sidebarCollapsed, sidebarOpen, setSidebarOpen } = useUIStore();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile, setSidebarOpen]);

  const sidebarWidth = sidebarCollapsed
    ? 'var(--sidebar-width-collapsed)'
    : 'var(--sidebar-width)';

  return (
    <div className="flex h-[100dvh] min-h-[100dvh] w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Main content */}
      <div
        className="flex flex-1 flex-col overflow-hidden transition-all duration-300 min-w-0"
        style={
          !isMobile
            ? { marginLeft: sidebarWidth }
            : undefined
        }
      >
        {/* Topbar */}
        <Navbar />

        {/* Page content with safe-area spacing reserved for MobileBottomNav */}
        <main className="flex-1 overflow-y-auto pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] lg:pb-0 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="min-h-full min-w-0 flex flex-col pb-28 sm:pb-32 lg:pb-8"
            >
              <div className="flex-1 min-w-0">
                {children}
              </div>
              {/* Dedicated bottom spacer for mobile bottom navigation so content is NEVER covered */}
              <div className="h-16 sm:h-20 lg:hidden shrink-0 pointer-events-none" aria-hidden="true" />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}

