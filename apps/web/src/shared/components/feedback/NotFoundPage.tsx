import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PawPrint, Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md text-center"
      >
        {/* Animated 404 */}
        <motion.div
          animate={{ rotate: [-5, 5, -5] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-3xl bg-primary/10"
        >
          <PawPrint className="h-16 w-16 text-primary/50" />
        </motion.div>

        <h1 className="mb-2 text-7xl font-bold text-foreground">404</h1>
        <h2 className="mb-3 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mb-8 text-sm text-muted">
          Looks like this pet wandered off! The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-foreground-2 transition-colors hover:bg-surface-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-primary/30 transition-opacity hover:opacity-90"
          >
            <Home className="h-4 w-4" />
            Back to Dashboard
          </button>
        </div>
      </motion.div>
    </div>
  );
}
