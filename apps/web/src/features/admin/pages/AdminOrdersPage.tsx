import React, { useState } from 'react';
import {
  Package,
  Search,
  Filter,
  Truck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  Edit3,
  Calendar,
  X,
  Loader2,
} from 'lucide-react';
import { useAdminOrders, useUpdateAdminOrderStatus } from '@/features/marketplace/hooks/useMarketplace';
import { formatCurrency, formatDate } from '@/shared/utils/cn';
import { getStatusBadge } from '@/features/orders/pages/OrdersPage';
import type { IOrder, OrderStatus } from '@petverse/shared-types';
import { toast } from 'sonner';

export default function AdminOrdersPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  const { data, isLoading, isError } = useAdminOrders({
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
    search: searchQuery.trim() || undefined,
    page,
    limit: 20,
  });

  const updateStatusMutation = useUpdateAdminOrderStatus();

  // Status update modal
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>('confirmed');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courier, setCourier] = useState('Blue Dart');
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [note, setNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleOpenUpdateModal = (order: IOrder) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setTrackingNumber(order.trackingNumber || '');
    setCourier(order.courier || 'Blue Dart');
    setEstimatedDelivery(order.estimatedDelivery || '');
    setNote('');
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setIsUpdating(true);
    try {
      await updateStatusMutation.mutateAsync({
        orderId: selectedOrder._id,
        data: {
          status: newStatus,
          trackingNumber: trackingNumber.trim() || undefined,
          courier: courier.trim() || undefined,
          estimatedDelivery: estimatedDelivery.trim() || undefined,
          note: note.trim() || undefined,
        },
      });
      toast.success(`Order #${selectedOrder._id.slice(-6)} updated to ${newStatus.replace(/_/g, ' ')}`);
      setSelectedOrder(null);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update order status.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="container-page py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Marketplace Orders</h1>
          <p className="text-xs text-muted">Manage marketplace order fulfillment, tracking numbers, and delivery statuses</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="card p-4 bg-surface border-border rounded-2xl space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted" />
            <input
              type="text"
              placeholder="Search by Order ID, customer name, phone, city..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="input-field pl-10 text-xs w-full"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto">
            {[
              { id: 'all', label: 'All Orders' },
              { id: 'confirmed', label: 'Confirmed' },
              { id: 'processing', label: 'Processing' },
              { id: 'packed', label: 'Packed' },
              { id: 'shipped', label: 'Shipped' },
              { id: 'delivered', label: 'Delivered' },
              { id: 'cancelled', label: 'Cancelled' },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setSelectedStatus(s.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  selectedStatus === s.id
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-surface-2 text-foreground/80 border-border hover:border-primary/40'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card bg-surface border-border rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-xs">Loading orders...</p>
          </div>
        ) : isError || !data?.orders ? (
          <div className="p-12 text-center text-muted">
            <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
            <p className="text-xs">Failed to load admin orders.</p>
          </div>
        ) : data.orders.length === 0 ? (
          <div className="p-12 text-center text-muted">
            <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs font-semibold">No orders found matching the filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-2 text-muted border-b border-border uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Items</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.orders.map((order) => {
                  const badge = getStatusBadge(order.status);
                  const Icon = badge.icon;
                  return (
                    <tr key={order._id} className="hover:bg-surface-2/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                        #{order._id.slice(-8).toUpperCase()}
                        <div className="text-[10px] text-muted font-normal">
                          {formatDate(order.createdAt, { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-foreground">
                          {order.shippingAddress.fullName}
                        </div>
                        <div className="text-[11px] text-muted">
                          {order.shippingAddress.city}, {order.shippingAddress.phone}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-foreground">
                          {order.items.reduce((s, i) => s + i.quantity, 0)} items
                        </span>
                        <div className="text-[10px] text-muted truncate max-w-[140px]">
                          {order.items.map((i) => i.name).join(', ')}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-foreground">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`capitalize font-semibold text-[11px] ${
                            order.paymentStatus === 'completed'
                              ? 'text-emerald-600'
                              : order.paymentStatus === 'failed'
                              ? 'text-rose-600'
                              : 'text-amber-600'
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                        <div className="text-[10px] text-muted uppercase">
                          {order.paymentMethod || 'online'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.className}`}
                        >
                          <Icon className="w-3 h-3" />
                          {badge.label}
                        </span>
                        {order.trackingNumber && (
                          <div className="text-[10px] text-muted mt-0.5">
                            {order.courier}: {order.trackingNumber}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenUpdateModal(order)}
                          className="btn-secondary py-1.5 px-2.5 text-[11px] font-semibold inline-flex items-center gap-1 shadow-sm"
                        >
                          <Edit3 className="w-3 h-3" />
                          Update Status
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-border text-xs text-muted">
            <span>
              Page {data.page} of {data.totalPages} ({data.total} total orders)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="btn-secondary py-1 px-3 text-xs disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="btn-secondary py-1 px-3 text-xs disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Update Order Status Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card p-6 bg-surface border-border rounded-2xl max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base text-foreground">
                Update Order #{selectedOrder._id.slice(-8).toUpperCase()}
              </h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-lg text-muted hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-foreground/80 mb-1">
                  Lifecycle Status *
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                  className="input-field text-xs"
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="processing">Processing</option>
                  <option value="packed">Packed</option>
                  <option value="shipped">Shipped</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled (Restores Stock)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-foreground/80 mb-1">
                    Courier Partner
                  </label>
                  <input
                    type="text"
                    value={courier}
                    onChange={(e) => setCourier(e.target.value)}
                    placeholder="e.g. Blue Dart, Delhivery"
                    className="input-field text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-foreground/80 mb-1">
                    AWB / Tracking Number
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g. BD102938475"
                    className="input-field text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-foreground/80 mb-1">
                  Estimated Delivery Date
                </label>
                <input
                  type="text"
                  value={estimatedDelivery}
                  onChange={(e) => setEstimatedDelivery(e.target.value)}
                  placeholder="e.g. Tomorrow by 7:00 PM, Oct 10"
                  className="input-field text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground/80 mb-1">
                  Internal / Customer Note
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Dispatched from Hyderabad Fulfilment Center"
                  className="input-field text-xs h-16"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="btn-secondary py-2 px-4 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-1.5"
                >
                  {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Save & Notify Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
