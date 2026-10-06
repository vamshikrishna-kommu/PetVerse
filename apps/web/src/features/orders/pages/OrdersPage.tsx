import React from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  ArrowRight,
  Clock,
  CheckCircle2,
  Truck,
  AlertTriangle,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import { useMyOrders } from '@/features/marketplace/hooks/useMarketplace';
import { formatCurrency, formatDate } from '@/shared/utils/cn';
import type { OrderStatus } from '@petverse/shared-types';

export function getStatusBadge(status: OrderStatus) {
  switch (status) {
    case 'delivered':
      return {
        label: 'Delivered',
        className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
        icon: CheckCircle2,
      };
    case 'out_for_delivery':
      return {
        label: 'Out for Delivery',
        className: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30',
        icon: Truck,
      };
    case 'shipped':
      return {
        label: 'Shipped',
        className: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
        icon: Truck,
      };
    case 'packed':
      return {
        label: 'Packed',
        className: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
        icon: Package,
      };
    case 'processing':
    case 'confirmed':
    case 'placed':
      return {
        label: status === 'confirmed' ? 'Confirmed' : 'Processing',
        className: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
        icon: Clock,
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        className: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
        icon: AlertTriangle,
      };
    case 'payment_failed':
      return {
        label: 'Payment Failed',
        className: 'bg-rose-500/10 text-rose-600 border-rose-500/30',
        icon: AlertTriangle,
      };
    default:
      return {
        label: 'Pending',
        className: 'bg-slate-500/10 text-slate-600 border-slate-500/30',
        icon: Clock,
      };
  }
}

export default function OrdersPage() {
  const { data: orders, isLoading, isError } = useMyOrders();

  if (isLoading) {
    return (
      <div className="container-page py-10 max-w-4xl space-y-4">
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight mb-6">My Orders</h1>
        {[1, 2, 3].map((i) => (
          <div key={i} className="card p-6 bg-surface border-border rounded-2xl animate-pulse space-y-3">
            <div className="h-5 bg-surface-2 rounded w-48" />
            <div className="h-4 bg-surface-2 rounded w-32" />
            <div className="h-10 bg-surface-2 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container-page py-16 text-center max-w-md mx-auto">
        <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-foreground">Failed to Load Orders</h2>
        <p className="text-xs text-muted mt-1 mb-6">Unable to retrieve order history right now.</p>
        <button onClick={() => window.location.reload()} className="btn-primary py-2 px-5 text-xs">
          Try Again
        </button>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="container-page py-16 text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-surface-2 rounded-2xl flex items-center justify-center mx-auto mb-4 text-muted">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">No Orders Yet</h2>
        <p className="text-sm text-muted mt-1 mb-6">
          You haven't placed any pet care or marketplace orders yet.
        </p>
        <Link to="/marketplace" className="btn-primary py-2.5 px-6 inline-flex items-center gap-2">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-8 max-w-4xl space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Order History</h1>
          <p className="text-xs text-muted">Track deliveries, view receipts, and manage your pet orders</p>
        </div>
        <Link to="/marketplace" className="btn-secondary py-2 px-3.5 text-xs font-semibold flex items-center gap-1.5">
          <ShoppingBag className="w-4 h-4 text-primary" />
          Marketplace
        </Link>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order) => {
          const badge = getStatusBadge(order.status);
          const Icon = badge.icon;
          const totalItemsCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

          return (
            <div
              key={order._id}
              className="card p-5 bg-surface border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow space-y-4"
            >
              {/* Order Meta Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">
                      Order #{order._id.slice(-8).toUpperCase()}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.className}`}
                    >
                      <Icon className="w-3 h-3" />
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    Placed on {formatDate(order.createdAt)} • {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-base font-extrabold text-foreground">
                    {formatCurrency(order.totalAmount)}
                  </div>
                  <span className="text-[10px] text-muted uppercase font-semibold">
                    {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                  </span>
                </div>
              </div>

              {/* Items Thumbnails & Names */}
              <div className="flex items-center gap-3 overflow-x-auto py-1 no-scrollbar">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2 shrink-0 bg-surface-2 p-1.5 rounded-xl border border-border">
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=100'}
                      alt={item.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                    <div className="pr-2">
                      <p className="text-xs font-semibold text-foreground max-w-[150px] truncate">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-muted">
                        Qty: {item.quantity} × {formatCurrency(item.price)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-border">
                <span className="text-xs text-muted truncate max-w-full">
                  Ship to: <span className="text-foreground font-medium">{order.shippingAddress?.fullName}</span> ({order.shippingAddress?.city})
                </span>

                <Link
                  to={`/orders/${order._id}`}
                  className="btn-primary py-1.5 px-3.5 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm w-full sm:w-auto shrink-0"
                >
                  Track & Details
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
