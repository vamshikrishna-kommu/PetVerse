import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@petverse/shared-constants';
import { paymentsApi } from '../api/paymentsApi';
import {
  CreditCard,
  ShieldCheck,
  Lock,
  Loader2,
  CheckCircle2,
  X,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/shared/utils/cn';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  appointmentType: string;
  amount: number;
  date?: string;
  onSuccess?: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  appointmentId,
  appointmentType,
  amount,
  date,
  onSuccess,
}) => {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [txId, setTxId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePay = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Initialize server-side checkout session
      const session = await paymentsApi.createCheckoutSession(appointmentId);

      // 2. Complete payment server-side (verification pipeline)
      const confirmation = await paymentsApi.confirmPayment(session.transactionId);

      if (confirmation.success) {
        setTxId(session.transactionId);
        setSuccess(true);
        toast.success('Payment verified & completed successfully!');
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.APPOINTMENTS });
        if (onSuccess) onSuccess();
      } else {
        throw new Error('Payment confirmation could not be verified.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Payment processing failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl border border-border">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-muted hover:text-foreground rounded-lg transition"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {success ? (
          <div className="text-center py-6 space-y-4">
            <div className="inline-flex p-4 rounded-full bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Payment Confirmed!</h3>
            <p className="text-sm text-muted">
              Your appointment booking fee has been securely verified and processed.
            </p>
            {txId && (
              <div className="p-3 bg-surface-2 rounded-xl text-xs font-mono text-muted text-center break-all">
                Ref: {txId}
              </div>
            )}
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition shadow-md"
            >
              Done
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Complete Payment</h3>
                <p className="text-xs text-muted">Secure Server-Side Checkout</p>
              </div>
            </div>

            {/* Invoice Summary */}
            <div className="p-4 bg-surface-2 rounded-xl border border-border space-y-2 text-sm">
              <div className="flex justify-between text-muted">
                <span>Appointment Type</span>
                <span className="font-semibold text-foreground capitalize">{appointmentType}</span>
              </div>
              {date && (
                <div className="flex justify-between text-muted">
                  <span>Scheduled Date</span>
                  <span className="font-semibold text-foreground">{date}</span>
                </div>
              )}
              <div className="border-t border-border pt-2 flex justify-between items-center text-base font-bold text-foreground">
                <span>Total Due</span>
                <span className="text-primary text-xl">{formatCurrency(amount)}</span>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-danger/10 text-danger text-xs rounded-xl border border-danger/20">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* PCI Compliance Notice */}
            <div className="flex items-start gap-2.5 p-3 bg-surface-2 rounded-xl text-[11px] text-muted">
              <Lock className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground block">
                  Encrypted & Secure Payment
                </span>
                Raw card details are never stored on PetVerse servers. Payments are processed
                server-side via Razorpay (India-first) with idempotent webhook verification.
              </div>
            </div>

            {/* Pay Button */}
            <button
              onClick={handlePay}
              disabled={loading}
              className="w-full py-3 px-4 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition shadow-lg shadow-primary/20 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Verifying Payment...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" /> Pay {formatCurrency(amount)} Now
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
