import { useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { useVerifyOtp } from '../hooks/useAuth';
import { getApiErrorMessage } from '@/shared/lib/axios';
import { cn } from '@/shared/utils/cn';

export default function OTPPage() {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const verifyMutation = useVerifyOtp();
  const location = useLocation();
  const navigate = useNavigate();

  const target = (location.state as { email?: string })?.email ?? '';

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
          <span className="font-medium text-foreground">{target || 'your email'}</span>
        </p>
      </div>

      {/* OTP inputs */}
      <div className="flex justify-center gap-2" onPaste={handlePaste}>
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputs.current[i] = el; }}
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
      {apiError && (
        <p className="text-sm text-danger">{apiError}</p>
      )}

      <p className="text-xs text-muted">
        Didn't receive it?{' '}
        <button className="font-medium text-primary hover:underline">
          Resend code
        </button>
      </p>
    </div>
  );
}
