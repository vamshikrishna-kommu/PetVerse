import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { loginSchema, type LoginInput } from '../validation/authSchema';
import { useLogin, useGoogleAuth } from '../hooks/useAuth';
import { getApiErrorMessage } from '@/shared/lib/axios';
import { cn } from '@/shared/utils/cn';

declare global {
  interface Window {
    google?: any;
  }
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useLogin();
  const googleMutation = useGoogleAuth();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    await loginMutation.mutateAsync(data).catch(() => {});
  };

  const handleGoogleLogin = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      toast.error('Google Sign-In is not configured (missing VITE_GOOGLE_CLIENT_ID)');
      return;
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: any) => {
          if (response.credential) {
            googleMutation.mutate(response.credential);
          }
        },
      });
      window.google.accounts.id.prompt();
    } else {
      toast.error('Google Auth library is not loaded. Please refresh or check connection.');
    }
  };

  const apiError = loginMutation.error ? getApiErrorMessage(loginMutation.error) : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
        <p className="mt-1 text-sm text-muted">
          Sign in to access your pet care dashboard.
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
        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="login-email" className="text-sm font-medium text-foreground-2">
            Email address
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            {...register('email')}
            className={cn('input', errors.email && 'input-error')}
          />
          {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="text-sm font-medium text-foreground-2">
              Password
            </label>
            <Link
              to="/auth/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
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

        {/* Submit */}
        <button
          id="login-submit"
          type="submit"
          disabled={isSubmitting || loginMutation.isPending}
          className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loginMutation.isPending ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
            />
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              Sign In
            </>
          )}

          {/* Shimmer overlay on hover */}
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 hover:translate-x-full" />
        </button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs text-muted">
          <span className="bg-surface px-3">or continue with</span>
        </div>
      </div>

      {/* Google OAuth */}
      <button
        id="login-google"
        type="button"
        onClick={handleGoogleLogin}
        disabled={googleMutation.isPending}
        className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-surface-2 py-3 text-sm font-medium text-foreground-2 transition-all hover:border-border-strong hover:bg-surface-3 disabled:opacity-60"
      >
        {/* Google icon */}
        <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        {googleMutation.isPending ? 'Connecting...' : 'Continue with Google'}
      </button>

      {/* Register link */}
      <p className="text-center text-sm text-muted">
        Don't have an account?{' '}
        <Link to="/auth/register" className="font-medium text-primary hover:underline">
          Create one free
        </Link>
      </p>
    </div>
  );
}
