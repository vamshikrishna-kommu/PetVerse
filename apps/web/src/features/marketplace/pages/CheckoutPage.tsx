import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShoppingBag,
  ArrowLeft,
  Truck,
  ShieldCheck,
  CreditCard,
  Banknote,
  Sparkles,
  MapPin,
  Phone,
  User,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useMarketplaceCartStore } from '../store/cart.store';
import { useCreateOrder, useVerifyPayment } from '../hooks/useMarketplace';
import { useAuthStore } from '@/app/store/auth.store';
import { formatCurrency } from '@/shared/utils/cn';
import { loadRazorpay } from '@/shared/lib/razorpayLoader';
import { toast } from 'sonner';

const INDIAN_STATES = [
  'Telangana',
  'Andhra Pradesh',
  'Karnataka',
  'Maharashtra',
  'Tamil Nadu',
  'Kerala',
  'Delhi',
  'Uttar Pradesh',
  'Gujarat',
  'Rajasthan',
  'West Bengal',
  'Madhya Pradesh',
  'Punjab',
  'Haryana',
  'Bihar',
  'Odisha',
  'Assam',
  'Goa',
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, getTotalPrice, clearCart } = useMarketplaceCartStore();
  const createOrderMutation = useCreateOrder();
  const verifyPaymentMutation = useVerifyPayment();

  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod' | 'test'>('razorpay');
  const [isProcessing, setIsProcessing] = useState(false);

  // Address form
  const [form, setForm] = useState({
    fullName: user ? `${user.profile.firstName || ''} ${user.profile.lastName || ''}`.trim() : '',
    phone: user?.phone || '',
    street: '',
    landmark: '',
    city: 'Hyderabad',
    state: 'Telangana',
    postalCode: '500081',
    country: 'India',
  });

  const subtotal = getTotalPrice();
  const deliveryCharge = subtotal >= 999 ? 0 : 49;
  const finalTotal = subtotal + deliveryCharge;

  // Empty cart guard
  if (items.length === 0) {
    return (
      <div className="container-page py-16 text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-surface-2 rounded-2xl flex items-center justify-center mx-auto mb-4 text-muted">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Your Cart is Empty</h2>
        <p className="text-sm text-muted mt-1 mb-6">
          Add pet food, treats, or healthcare essentials to proceed with checkout.
        </p>
        <Link to="/marketplace" className="btn-primary py-2.5 px-6 inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Explore Marketplace
        </Link>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.fullName.trim() || !form.phone.trim() || !form.street.trim() || !form.city.trim()) {
      toast.error('Please complete all required address fields.');
      return;
    }

    if (!/^\d{6}$/.test(form.postalCode.trim())) {
      toast.error('Please enter a valid 6-digit Indian PIN code.');
      return;
    }

    setIsProcessing(true);

    try {
      const orderPayload = {
        items: items.map((i) => ({
          productId: i.product._id,
          quantity: i.quantity,
        })),
        shippingAddress: {
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          street: form.street.trim(),
          landmark: form.landmark.trim() || undefined,
          city: form.city.trim(),
          state: form.state.trim(),
          postalCode: form.postalCode.trim(),
          country: 'India',
        },
        paymentMethod,
      };

      const order = await createOrderMutation.mutateAsync(orderPayload);

      // Handle Cash on Delivery
      if (paymentMethod === 'cod') {
        clearCart();
        toast.success('Order placed successfully via Cash on Delivery!');
        navigate(`/orders/${order._id}`);
        return;
      }

      // Handle Free Test Simulation / Demo
      if (paymentMethod === 'test') {
        const dummyPaymentId = `pay_test_${Date.now()}`;
        await verifyPaymentMutation.mutateAsync({
          orderId: order._id,
          data: {
            razorpayOrderId: order.razorpayOrderId || `order_test_${Date.now()}`,
            razorpayPaymentId: dummyPaymentId,
            razorpaySignature: 'simulated_test_signature',
          },
        });
        clearCart();
        toast.success('Test payment verified! Order confirmed.');
        navigate(`/orders/${order._id}`);
        return;
      }

      // Handle Razorpay Online Payment
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      const isRazorpayConfigured =
        razorpayKey &&
        !razorpayKey.includes('your-') &&
        !razorpayKey.includes('placeholder');

      if (!isRazorpayConfigured) {
        // Safe simulation fallback when merchant key is not yet set
        const dummyPaymentId = `pay_sim_${Date.now()}`;
        await verifyPaymentMutation.mutateAsync({
          orderId: order._id,
          data: {
            razorpayOrderId: order.razorpayOrderId || `order_sim_${Date.now()}`,
            razorpayPaymentId: dummyPaymentId,
            razorpaySignature: 'simulated_dev_signature',
          },
        });
        clearCart();
        toast.success('Payment simulated successfully! Order confirmed.');
        navigate(`/orders/${order._id}`);
        return;
      }

      // Load Razorpay Standard Checkout SDK
      const RazorpaySDK = await loadRazorpay();

      const options = {
        key: razorpayKey,
        amount: Math.round(order.totalAmount * 100),
        currency: 'INR',
        name: 'PetVerse India Marketplace',
        description: `Order #${order._id.slice(-6)}`,
        order_id: order.razorpayOrderId,
        prefill: {
          name: form.fullName,
          contact: form.phone,
          email: user?.email || '',
        },
        theme: {
          color: '#6366f1',
        },
        handler: async (response: any) => {
          try {
            await verifyPaymentMutation.mutateAsync({
              orderId: order._id,
              data: {
                razorpayOrderId: response.razorpay_order_id || order.razorpayOrderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              },
            });
            clearCart();
            toast.success('Payment verified! Order confirmed.');
            navigate(`/orders/${order._id}`);
          } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Payment verification failed.');
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            toast.info('Payment window closed. You can retry from your orders.');
          },
        },
      };

      const rzpInstance = new RazorpaySDK(options);
      rzpInstance.open();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to place order.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="container-page py-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          to="/marketplace"
          className="p-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Checkout</h1>
          <p className="text-xs text-muted">Complete your delivery address and payment in ₹ INR</p>
        </div>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Delivery Address & Payment Method */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: Delivery Address */}
          <div className="card p-6 bg-surface border-border rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-foreground font-bold text-base pb-3 border-b border-border">
              <MapPin className="w-5 h-5 text-primary" />
              <h3>1. Delivery Address (India)</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-muted" />
                  <input
                    type="text"
                    required
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="input-field pl-9 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1">
                  Phone Number (10 digits) *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-muted" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="e.g. 9849012345"
                    className="input-field pl-9 text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1">
                Flat, House No., Building, Street *
              </label>
              <input
                type="text"
                required
                value={form.street}
                onChange={(e) => setForm({ ...form, street: e.target.value })}
                placeholder="e.g. Plot 42, Silicon Valley, Hitec City"
                className="input-field text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground/80 mb-1">
                Landmark (Optional)
              </label>
              <input
                type="text"
                value={form.landmark}
                onChange={(e) => setForm({ ...form, landmark: e.target.value })}
                placeholder="e.g. Opposite Cyber Towers, Near Metro Station"
                className="input-field text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1">City *</label>
                <input
                  type="text"
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="e.g. Hyderabad"
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1">State *</label>
                <select
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  className="input-field text-sm"
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground/80 mb-1">
                  PIN Code *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={form.postalCode}
                  onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                  placeholder="500081"
                  className="input-field text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Payment Method */}
          <div className="card p-6 bg-surface border-border rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-foreground font-bold text-base pb-3 border-b border-border">
              <CreditCard className="w-5 h-5 text-primary" />
              <h3>2. Select Payment Method</h3>
            </div>

            <div className="space-y-3">
              {/* Razorpay Option */}
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'razorpay'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-surface-2 hover:border-primary/40'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="razorpay"
                  checked={paymentMethod === 'razorpay'}
                  onChange={() => setPaymentMethod('razorpay')}
                  className="mt-1 text-primary focus:ring-primary"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="font-semibold text-sm text-foreground">
                      Razorpay (India UPI, Cards, NetBanking)
                    </span>
                    <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full shrink-0">
                      RECOMMENDED
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    Instant payment via GPay, PhonePe, Paytm, Debit/Credit Card, or NetBanking.
                  </p>
                </div>
              </label>

              {/* Cash on Delivery Option */}
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'cod'
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border bg-surface-2 hover:border-primary/40'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="mt-1 text-primary focus:ring-primary shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                      <Banknote className="w-4 h-4 text-emerald-600 shrink-0" />
                      Cash on Delivery (COD)
                    </span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-600 font-bold px-2 py-0.5 rounded-full shrink-0">
                      NO EXTRA CHARGE
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    Pay in cash or UPI when the package is delivered to your doorstep.
                  </p>
                </div>
              </label>

              {/* Free Test Mode Simulation */}
              <label
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  paymentMethod === 'test'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 ring-1 ring-emerald-500'
                    : 'border-border bg-surface-2 hover:border-emerald-500/40'
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="test"
                  checked={paymentMethod === 'test'}
                  onChange={() => setPaymentMethod('test')}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
                      100% Free Test Simulation (Zero Cost)
                    </span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-600 font-bold px-2 py-0.5 rounded-full shrink-0">
                      FREE DEMO
                    </span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    Simulates immediate payment without real charges. Perfect for testing full order tracking!
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Action */}
        <div className="lg:col-span-5 space-y-6">
          <div className="card p-6 bg-surface border-border rounded-2xl shadow-sm space-y-5 sticky top-24">
            <h3 className="font-bold text-base text-foreground pb-3 border-b border-border flex items-center justify-between">
              <span>Order Summary</span>
              <span className="text-xs font-normal text-muted">{items.length} unique items</span>
            </h3>

            {/* Items list */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.product._id} className="flex items-center gap-3">
                  <img
                    src={item.product.images?.[0] || 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=100'}
                    alt={item.product.name}
                    className="w-12 h-12 rounded-xl object-cover border border-border shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-foreground truncate">
                      {item.product.name}
                    </h4>
                    <p className="text-[11px] text-muted">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-xs font-bold text-foreground shrink-0">
                    {formatCurrency(item.product.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Calculations */}
            <div className="space-y-2 pt-3 border-t border-border text-xs text-muted">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-foreground">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-primary" /> Delivery Charge
                </span>
                {deliveryCharge === 0 ? (
                  <span className="text-emerald-600 font-bold uppercase tracking-wider text-[11px]">
                    FREE (Orders &gt; ₹999)
                  </span>
                ) : (
                  <span className="font-semibold text-foreground">{formatCurrency(deliveryCharge)}</span>
                )}
              </div>
              <div className="flex justify-between text-sm font-bold text-foreground pt-3 border-t border-border">
                <span>Total Amount</span>
                <span className="text-primary text-base">{formatCurrency(finalTotal)}</span>
              </div>
            </div>

            {/* Place Order CTA Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full btn-primary py-3 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing Order...
                </>
              ) : paymentMethod === 'cod' ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm Cash on Delivery ({formatCurrency(finalTotal)})
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Pay Now ({formatCurrency(finalTotal)})
                </>
              )}
            </button>

            {/* Buyer Protection Note */}
            <div className="flex items-center gap-2 p-3 bg-surface-2 rounded-xl text-[11px] text-muted">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>PetVerse Buyer Protection: 100% Genuine Pet Care & Easy Returns.</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
