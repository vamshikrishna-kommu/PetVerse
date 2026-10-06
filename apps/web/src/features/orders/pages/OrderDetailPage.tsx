import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  ArrowLeft,
  AlertTriangle,
  XCircle,
  ShieldCheck,
  CreditCard,
  FileText,
  Loader2,
} from 'lucide-react';
import { useOrderDetails, useCancelOrder } from '@/features/marketplace/hooks/useMarketplace';
import { formatCurrency, formatDate } from '@/shared/utils/cn';
import { getStatusBadge } from './OrdersPage';
import type { OrderStatus } from '@petverse/shared-types';
import { toast } from 'sonner';

const LIFECYCLE_STEPS: Array<{ key: OrderStatus; label: string; icon: any }> = [
  { key: 'placed', label: 'Order Placed', icon: Clock },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'processing', label: 'Processing', icon: Package },
  { key: 'packed', label: 'Packed', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
];

function getStepIndex(status: OrderStatus): number {
  switch (status) {
    case 'payment_pending':
      return 0;
    case 'placed':
      return 0;
    case 'confirmed':
      return 1;
    case 'processing':
      return 2;
    case 'packed':
      return 3;
    case 'shipped':
      return 4;
    case 'out_for_delivery':
      return 5;
    case 'delivered':
      return 6;
    default:
      return 0;
  }
}

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { data: order, isLoading, isError } = useOrderDetails(orderId || '');
  const cancelOrderMutation = useCancelOrder();

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  if (isLoading) {
    return (
      <div className="container-page py-16 text-center max-w-md mx-auto">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
        <p className="text-sm text-muted">Loading order details & tracking...</p>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="container-page py-16 text-center max-w-md mx-auto">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-foreground">Order Not Found</h2>
        <p className="text-xs text-muted mt-1 mb-6">
          Unable to locate order #{orderId}. It may not exist or you do not have permission to view it.
        </p>
        <Link to="/orders" className="btn-primary py-2 px-5 text-xs">
          Back to Orders
        </Link>
      </div>
    );
  }

  const isCancelled = order.status === 'cancelled' || order.status === 'payment_failed';
  const currentStepIdx = getStepIndex(order.status);
  const badge = getStatusBadge(order.status);
  const canCancel = ['payment_pending', 'placed', 'confirmed'].includes(order.status);

  const handleConfirmCancel = async () => {
    if (!orderId) return;
    setIsCancelling(true);
    try {
      await cancelOrderMutation.mutateAsync({
        orderId,
        reason: cancelReason || 'Cancelled by customer',
      });
      toast.success('Order has been cancelled.');
      setShowCancelModal(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="container-page py-8 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/orders"
            className="p-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
                Order #{order._id.slice(-8).toUpperCase()}
              </h1>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${badge.className}`}
              >
                {badge.label}
              </span>
            </div>
            <p className="text-xs text-muted mt-0.5">
              Placed on {formatDate(order.createdAt, { dateStyle: 'long', timeStyle: 'short' })}
            </p>
          </div>
        </div>

        {canCancel && (
          <button
            onClick={() => setShowCancelModal(true)}
            className="btn-secondary py-2 px-3 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 border-rose-200 dark:border-rose-900/50"
          >
            Cancel Order
          </button>
        )}
      </div>

      {/* Visual Tracking Progress Timeline */}
      <div className="card p-6 bg-surface border-border rounded-2xl shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-foreground flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-primary" />
            Delivery Tracking Timeline
          </span>
          {order.estimatedDelivery && (
            <span className="text-xs text-muted font-normal">
              Est. Delivery: <strong className="text-foreground">{order.estimatedDelivery}</strong>
            </span>
          )}
        </h3>

        {isCancelled ? (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl flex items-start gap-3">
            <XCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-rose-900 dark:text-rose-200">
                Order Cancelled
              </h4>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                {order.cancellationReason || 'This order was cancelled and inventory has been restored.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="pt-2">
            {/* Horizontal Timeline Bar */}
            <div className="relative flex items-center justify-between">
              {/* Connecting line */}
              <div className="absolute left-4 right-4 top-4 h-1 bg-surface-3 -z-0">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (currentStepIdx / (LIFECYCLE_STEPS.length - 1)) * 100)}%`,
                  }}
                />
              </div>

              {LIFECYCLE_STEPS.map((step, idx) => {
                const isCompleted = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                const StepIcon = step.icon;

                return (
                  <div key={step.key} className="flex flex-col items-center z-10 text-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isCurrent
                          ? 'bg-primary text-white ring-4 ring-primary/20 scale-110 shadow-md'
                          : isCompleted
                          ? 'bg-primary text-white'
                          : 'bg-surface-2 text-muted border border-border'
                      }`}
                    >
                      <StepIcon className="w-4 h-4" />
                    </div>
                    <span
                      className={`text-[11px] font-semibold mt-2 max-w-[80px] leading-tight ${
                        isCompleted ? 'text-foreground' : 'text-muted'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Courier / Shipping Tracking Details */}
        {(order.trackingNumber || order.courier) && (
          <div className="p-3 bg-surface-2 rounded-xl text-xs text-foreground flex flex-wrap items-center justify-between gap-2 border border-border mt-4">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-primary shrink-0" />
              <span>
                Courier Partner: <strong>{order.courier || 'Express Delivery'}</strong>
              </span>
            </div>
            {order.trackingNumber && (
              <div className="text-muted">
                AWB / Tracking Number: <strong className="text-foreground">{order.trackingNumber}</strong>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid: Order Items & Delivery Details */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left: Items Summary */}
        <div className="md:col-span-7 card p-6 bg-surface border-border rounded-2xl shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-foreground pb-2 border-b border-border flex items-center gap-2">
            <Package className="w-4 h-4 text-primary" />
            Items Ordered ({order.items.length})
          </h3>

          <div className="space-y-3">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 py-2 border-b border-border last:border-b-0">
                <img
                  src={item.image || 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=100'}
                  alt={item.name}
                  className="w-14 h-14 rounded-xl object-cover border border-border shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-foreground line-clamp-1">{item.name}</h4>
                  <p className="text-[11px] text-muted mt-0.5">
                    Qty: {item.quantity} × {formatCurrency(item.price)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-foreground">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Breakdown */}
          <div className="space-y-2 pt-3 border-t border-border text-xs text-muted">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold text-foreground">
                {formatCurrency(order.subtotal ?? order.totalAmount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Charge</span>
              <span className="font-semibold text-foreground">
                {order.deliveryCharge === 0 ? 'FREE' : formatCurrency(order.deliveryCharge ?? 0)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold text-foreground pt-2 border-t border-border">
              <span>Total Paid / Payable</span>
              <span className="text-primary text-base">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Right: Shipping Address & Payment Info */}
        <div className="md:col-span-5 space-y-6">
          {/* Shipping Address Card */}
          <div className="card p-6 bg-surface border-border rounded-2xl shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-foreground pb-2 border-b border-border flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              Delivery Address
            </h3>

            <div className="text-xs text-foreground/90 space-y-1">
              <p className="font-bold text-sm text-foreground">{order.shippingAddress.fullName}</p>
              <p className="text-muted">{order.shippingAddress.street}</p>
              {order.shippingAddress.landmark && (
                <p className="text-muted">Landmark: {order.shippingAddress.landmark}</p>
              )}
              <p className="text-muted">
                {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}
              </p>
              <p className="text-muted flex items-center gap-1 pt-1">
                <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                {order.shippingAddress.phone}
              </p>
            </div>
          </div>

          {/* Payment Details Card */}
          <div className="card p-6 bg-surface border-border rounded-2xl shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-foreground pb-2 border-b border-border flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              Payment Information
            </h3>

            <div className="text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-muted">Method:</span>
                <span className="font-semibold uppercase text-foreground">
                  {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay / Online'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Status:</span>
                <span
                  className={`font-bold capitalize ${
                    order.paymentStatus === 'completed'
                      ? 'text-emerald-600'
                      : order.paymentStatus === 'failed'
                      ? 'text-rose-600'
                      : 'text-amber-600'
                  }`}
                >
                  {order.paymentStatus}
                </span>
              </div>
              {order.paymentId && (
                <div className="flex justify-between">
                  <span className="text-muted">Payment ID:</span>
                  <span className="font-mono text-[11px] text-foreground">{order.paymentId}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-6 bg-surface border-border rounded-2xl max-w-md w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-foreground">Cancel Order</h3>
            <p className="text-xs text-muted">
              Are you sure you want to cancel this order? Any reserved inventory will be restored immediately.
            </p>

            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1">
                Reason for cancellation (Optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Changed my mind, found another product..."
                className="input-field text-xs h-20"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="btn-secondary py-2 px-4 text-xs font-semibold"
              >
                Keep Order
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleConfirmCancel}
                className="btn-primary py-2 px-4 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
