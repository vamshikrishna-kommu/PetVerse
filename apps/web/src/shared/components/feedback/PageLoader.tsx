import { motion } from 'framer-motion';
import { PawPrint } from 'lucide-react';

export default function PageLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-6"
      >
        {/* Logo */}
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-xl shadow-primary/30"
        >
          <PawPrint className="h-9 w-9 text-white" />
        </motion.div>

        {/* Loading bar */}
        <div className="h-1 w-40 overflow-hidden rounded-full bg-surface-2">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: '50%' }}
          />
        </div>

        <p className="text-sm text-muted">Loading PetVerse…</p>
      </motion.div>
    </div>
  );
}
