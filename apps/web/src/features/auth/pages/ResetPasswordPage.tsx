import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import { resetPasswordSchema, type ResetPasswordInput } from '../validation/authSchema';
import { useResetPassword } from '../hooks/useAuth';
import { getApiErrorMessage } from '@/shared/lib/axios';
import { cn } from '@/shared/utils/cn';

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';

  const resetMutation = useResetPassword();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordInput) => {
    await resetMutation.mutateAsync({ token, password: data.password }).catch(() => {});
  };

  const apiError = resetMutation.error ? getApiErrorMessage(resetMutation.error) : null;

  // No token in URL — show helpful error
  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-danger/10">
          <AlertCircle className="h-8 w-8 text-danger" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Invalid Reset Link</h2>
        <p className="text-sm text-muted">
          This password reset link is missing or invalid. Please request a new one.
        </p>
        <Link
          to="/auth/forgot-password"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          Request new link
        </Link>
      </div>
    );
  }

  // Success state
  if (resetMutation.isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-4 text-center"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-success/10">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Password Updated!</h2>
        <p className="text-sm text-muted">
          Your password has been changed successfully. You can now sign in.
        </p>
        <button
          onClick={() => navigate('/auth/login')}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/30 hover:opacity-90 transition-all"
        >
          Sign In
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Set new password</h2>
        <p className="mt-1 text-sm text-muted">
          Choose a strong password for your account.
        </p>
      </div>

      {/* API Error */}
      {apiError && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2.5 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {apiError}
        </motion.div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* New Password */}
        <div className="space-y-1.5">
          <label htmlFor="reset-password" className="text-sm font-medium text-foreground-2">
            New Password
          </label>
          <div className="relative">
            <input
              id="reset-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Create a strong password"
              {...register('password')}
              className={cn('input pr-10', errors.password && 'input-error')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-foreground"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-danger">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label htmlFor="reset-confirm" className="text-sm font-medium text-foreground-2">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              id="reset-confirm"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Repeat your new password"
              {...register('confirmPassword')}
              className={cn('input pr-10', errors.confirmPassword && 'input-error')}
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-foreground"
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-danger">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Submit */}
        <button
          id="reset-submit"
          type="submit"
          disabled={resetMutation.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {resetMutation.isPending ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
            />
          ) : (
            <>
              <Lock className="h-4 w-4" />
              Update Password
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
