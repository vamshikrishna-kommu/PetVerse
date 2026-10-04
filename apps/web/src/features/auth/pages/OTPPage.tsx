import { useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight, RefreshCw } from 'lucide-react';
import { useVerifyOtp } from '../hooks/useAuth';
import { useAuthStore } from '@/app/store/auth.store';
import { authApi } from '../api/authApi';
import { getApiErrorMessage } from '@/shared/lib/axios';
import { cn } from '@/shared/utils/cn';
import { toast } from 'sonner';

export default function OTPPage() {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [isResending, setIsResending] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const verifyMutation = useVerifyOtp();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const target = (location.state as { email?: string })?.email || user?.email || '';

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputs.current[index + 1]?.focus();

    // Auto-submit when complete
    if (newOtp.every(Boolean)) {
      verifyMutation.mutate({ target, otp: newOtp.join('') });
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      verifyMutation.mutate({ target, otp: pasted });
    }
  };

  const handleResend = async () => {
    if (!target) {
      toast.error('No email address available to resend code');
      return;
    }
    setIsResending(true);
    try {
      await authApi.sendOtp(target, 'email');
      toast.success(`Verification code sent to ${target}`);
    } catch (err: any) {
      toast.error(getApiErrorMessage(err) || 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  const apiError = verifyMutation.error ? getApiErrorMessage(verifyMutation.error) : null;

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <ShieldCheck className="h-8 w-8 text-primary" />
      </div>

      <div>
        <h2 className="text-2xl font-bold text-foreground">Verify your email</h2>
        <p className="mt-2 text-sm text-muted">
          We sent a 6-digit code to{' '}
          <span className="font-medium text-foreground">{target || 'your account'}</span>
        </p>
      </div>

      {/* Demo / Unconfigured helper banner */}
      <div className="rounded-xl p-3 bg-surface-2 border border-border text-[11px] text-muted text-left">
        💡 <strong>Quick Access:</strong> Enter <strong>123456</strong> or click <strong>Continue to Dashboard</strong> below to verify immediately.
      </div>

      {/* OTP inputs */}
      <div className="flex justify-center gap-2" onPaste={handlePaste}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              inputs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={cn(
              'h-12 w-11 rounded-xl border text-center text-lg font-bold transition-all',
              digit
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-surface-2 text-foreground',
              'focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'
            )}
            aria-label={`OTP digit ${i + 1}`}
          />
        ))}
      </div>

      {/* Loading */}
      {verifyMutation.isPending && (
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-sm text-muted"
        >
          Verifying…
        </motion.div>
      )}

      {/* Error */}
      {apiError && <p className="text-sm text-danger">{apiError}</p>}

      <div className="space-y-3 pt-1">
        <p className="text-xs text-muted">
          Didn't receive it?{' '}
          <button
            onClick={handleResend}
            disabled={isResending}
            className="font-medium text-primary hover:underline inline-flex items-center gap-1 disabled:opacity-50"
          >
            {isResending && <RefreshCw className="w-3 h-3 animate-spin" />}
            Resend code
          </button>
        </p>

        <div>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
          >
            Skip for now &amp; Continue to Dashboard <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
