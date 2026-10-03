import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft } from 'lucide-react';
import { forgotPasswordSchema, type ForgotPasswordInput } from '../validation/authSchema';
import { useForgotPassword } from '../hooks/useAuth';
import { cn } from '@/shared/utils/cn';

export default function ForgotPasswordPage() {
  const forgotMutation = useForgotPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = (data: ForgotPasswordInput) => {
    forgotMutation.mutate(data.email);
  };

  if (forgotMutation.isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-4 text-center"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10">
          <Mail className="h-8 w-8 text-success" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Check your email</h2>
        <p className="text-sm text-muted">
          We've sent a password reset link. Check your inbox and spam folder.
        </p>
        <Link
          to="/auth/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to login
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Forgot password?</h2>
        <p className="mt-1 text-sm text-muted">
          Enter your email and we'll send a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="forgot-email" className="text-sm font-medium text-foreground-2">
            Email address
          </label>
          <input
            id="forgot-email"
            type="email"
            placeholder="you@example.com"
            {...register('email')}
            className={cn('input', errors.email && 'input-error')}
          />
          {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
        </div>

        <button
          id="forgot-submit"
          type="submit"
          disabled={forgotMutation.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-md shadow-primary/30 transition-all hover:opacity-90 disabled:opacity-60"
        >
          {forgotMutation.isPending ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
            />
          ) : (
            <>
              <Mail className="h-4 w-4" />
              Send Reset Link
            </>
          )}
        </button>
      </form>

      <Link
        to="/auth/login"
        className="flex items-center justify-center gap-1.5 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to login
      </Link>
    </div>
  );
}
