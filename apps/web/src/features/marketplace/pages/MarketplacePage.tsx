import React, { useState } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  Star,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Clock,
  Package,
  Truck,
  ShieldCheck,
  X,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import {
  useMarketplaceProducts,
  useMyOrders,
  useCreateOrder,
} from '../hooks/useMarketplace';
import { useMarketplaceCartStore } from '../store/cart.store';
import { useAuthStore } from '@/app/store/auth.store';
import type { ProductCategory, IProduct } from '@petverse/shared-types';
import { toast } from 'sonner';
import { formatCurrency } from '@/shared/utils/cn';

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'all', label: 'All Essentials' },
  { id: 'pharmacy', label: 'Pharmacy & Wellness' },
  { id: 'food', label: 'Prescription Diets' },
  { id: 'bedding', label: 'Orthopedic Bedding' },
  { id: 'grooming', label: 'Grooming & Hygiene' },
  { id: 'accessories', label: 'Safety & Leashes' },
  { id: 'toys', label: 'Enrichment Toys' },
];

export default function MarketplacePage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'catalog' | 'orders'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);

  // Cart store
  const {
    items: cartItems,
    isCartOpen,
    openCart,
    closeCart,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalCount,
    getTotalPrice,
  } = useMarketplaceCartStore();

  // Queries
  const { data: catalogData, isLoading: productsLoading } = useMarketplaceProducts({
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    search: searchQuery.trim() || undefined,
  });

  const { data: myOrders, isLoading: ordersLoading } = useMyOrders();
  const createOrderMutation = useCreateOrder();

  // Shipping address form
  const [shippingForm, setShippingForm] = useState({
    fullName: user ? `${user.profile.firstName} ${user.profile.lastName}` : '',
    phone: user?.phone || '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'United States',
  });

  const handleAddToCart = (product: IProduct) => {
    if (product.stock <= 0) {
      toast.error('Item is currently out of stock');
      return;
    }
    addItem(product, 1);
    toast.success(`Added "${product.name}" to cart`);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in to complete your checkout');
      return;
    }
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    try {
      const orderPayload = {
        items: cartItems.map((item) => ({
          productId: item.product._id,
          quantity: item.quantity,
        })),
        shippingAddress: shippingForm,
      };

      await createOrderMutation.mutateAsync(orderPayload);
      clearCart();
      setShowCheckoutModal(false);
      closeCart();
      setActiveTab('orders');
      toast.success('Order placed successfully! Status: Payment Pending');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    }
  };

  const cartTotal = getTotalPrice();
  const shippingFee = cartTotal > 45 || cartTotal === 0 ? 0 : 5.0;
  const grandTotal = Math.round((cartTotal + shippingFee) * 100) / 100;

  return (
    <div className="container-page max-w-7xl py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <ShoppingBag className="w-8 h-8 text-primary" /> Pet Care Marketplace
          </h1>
          <p className="text-muted text-sm mt-1">
            Veterinarian-approved diets, clinical supplements, therapeutic beds, and safety gear.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-surface-2 p-1 rounded-xl border border-border text-xs">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === 'catalog'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              Shop Catalog
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === 'orders'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              My Orders ({myOrders?.length || 0})
            </button>
          </div>

          <button
            onClick={openCart}
            className="btn btn-primary relative text-xs flex items-center gap-2 shadow-md shadow-primary/20"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Cart</span>
            {getTotalCount() > 0 && (
              <span className="w-5 h-5 bg-white text-primary text-[10px] font-black rounded-full flex items-center justify-center">
                {getTotalCount()}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: CATALOG */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 text-xs">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl font-medium transition whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? 'bg-primary text-white shadow-sm'
                      : 'bg-surface-2 text-muted hover:bg-surface-3 hover:text-foreground'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search food, supplements, toys..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input w-full pl-9 py-1.5 text-xs"
              />
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {catalogData?.products?.map((product) => (
              <div
                key={product._id}
                className="card overflow-hidden border-border hover:border-primary/40 transition flex flex-col justify-between shadow-sm group"
              >
                <div>
                  <div className="relative h-48 bg-surface-3 overflow-hidden">
                    <img
                      src={product.images?.[0] || 'https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?w=600&auto=format&fit=crop&q=80'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <span className="absolute top-2.5 left-2.5 badge bg-black/60 text-white backdrop-blur-sm border-0 text-[10px] font-bold uppercase tracking-wider">
                      {product.category}
                    </span>
                    {product.stock <= 5 && product.stock > 0 && (
                      <span className="absolute bottom-2.5 right-2.5 badge bg-amber-500 text-white border-0 text-[10px] font-bold">
                        Only {product.stock} left
                      </span>
                    )}
                  </div>

                  <div className="p-5 space-y-2">
                    <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{product.rating}</span>
                      <span className="text-muted font-normal text-[11px]">
                        ({product.reviewsCount} reviews)
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition">
                      {product.name}
                    </h3>

                    <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>

                    {product.petSpecies && product.petSpecies.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {product.petSpecies.map((sp) => (
                          <span
                            key={sp}
                            className="text-[9px] uppercase font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded"
                          >
                            {sp}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-5 pt-0 flex items-center justify-between border-t border-border mt-3">
                  <div>
                    <span className="text-[10px] text-muted block uppercase">Price</span>
                    <span className="text-lg font-extrabold text-foreground">
                      {formatCurrency(product.price)}
                    </span>
                  </div>

                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={product.stock <= 0}
                    className="btn btn-primary text-xs flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty products state */}
          {(!catalogData?.products || catalogData.products.length === 0) && !productsLoading && (
            <div className="card p-12 text-center border-border space-y-3">
              <ShoppingBag className="w-12 h-12 text-muted mx-auto opacity-40" />
              <h3 className="text-base font-bold text-foreground">No Products Found</h3>
              <p className="text-xs text-muted max-w-sm mx-auto">
                No items match your filter criteria. Try adjusting the category or clearing the search bar.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY ORDERS */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="space-y-4">
            {myOrders?.map((order) => (
              <div key={order._id} className="card p-6 border-border space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">
                        Order #{order._id.slice(-8).toUpperCase()}
                      </span>
                      <span
                        className={`badge text-[10px] font-bold uppercase tracking-wider ${
                          order.status === 'delivered'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : order.status === 'shipped'
                            ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                            : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        }`}
                      >
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-xs text-muted">
                      Placed on {new Date(order.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-muted block">Order Total</span>
                    <span className="text-base font-black text-foreground">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div className="divide-y divide-border">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-10 h-10 rounded-lg object-cover bg-surface-3 border border-border"
                          />
                        )}
                        <div>
                          <div className="font-semibold text-foreground">{item.name}</div>
                          <div className="text-muted text-[11px]">Qty: {item.quantity}</div>
                        </div>
                      </div>
                      <span className="font-bold text-foreground">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Shipping address footer */}
                <div className="pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted">
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-primary" />
                    <span>
                      Shipping to: {order.shippingAddress.street}, {order.shippingAddress.city},{' '}
                      {order.shippingAddress.state} {order.shippingAddress.postalCode}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500 font-semibold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Payment: {order.paymentStatus}</span>
                  </div>
                </div>
              </div>
            ))}

            {(!myOrders || myOrders.length === 0) && !ordersLoading && (
              <div className="card p-12 text-center border-border space-y-3">
                <Package className="w-12 h-12 text-muted mx-auto opacity-40" />
                <h3 className="text-base font-bold text-foreground">No Orders Yet</h3>
                <p className="text-xs text-muted max-w-sm mx-auto">
                  When you purchase wellness products or therapeutic diets, your order tracking will appear here.
                </p>
                <button
                  onClick={() => setActiveTab('catalog')}
                  className="btn btn-primary text-xs inline-flex items-center gap-2 mt-2"
                >
                  Browse Catalog
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SLIDE-OVER CART DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-surface h-full shadow-2xl flex flex-col justify-between border-l border-border animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                <h2 className="text-base font-bold text-foreground">Shopping Cart</h2>
                <span className="badge bg-primary/10 text-primary text-xs font-bold">
                  {getTotalCount()}
                </span>
              </div>
              <button
                onClick={closeCart}
                className="p-1.5 text-muted hover:text-foreground rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 divide-y divide-border">
              {cartItems.map((item) => (
                <div key={item.product._id} className="pt-4 first:pt-0 flex gap-3">
                  <img
                    src={item.product.images?.[0] || ''}
                    alt={item.product.name}
                    className="w-16 h-16 rounded-xl object-cover bg-surface-2 border border-border flex-shrink-0"
                  />
                  <div className="flex-1 space-y-1.5">
                    <h4 className="text-xs font-bold text-foreground line-clamp-1">
                      {item.product.name}
                    </h4>
                    <div className="text-xs font-extrabold text-primary">
                      {formatCurrency(item.product.price)}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center border border-border rounded-lg bg-surface-2">
                        <button
                          onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                          className="p-1 hover:text-primary transition"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-foreground">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                          className="p-1 hover:text-primary transition"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.product._id)}
                        className="text-muted hover:text-danger text-xs transition p-1"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {cartItems.length === 0 && (
                <div className="py-20 text-center space-y-3">
                  <ShoppingBag className="w-12 h-12 text-muted mx-auto opacity-40" />
                  <p className="text-xs text-muted">Your cart is currently empty.</p>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            {cartItems.length > 0 && (
              <div className="p-5 border-t border-border space-y-4 bg-surface-2/40">
                <div className="space-y-1.5 text-xs text-muted">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-bold text-foreground">{formatCurrency(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Standard Shipping</span>
                    <span className="font-bold text-foreground">
                      {shippingFee === 0 ? 'FREE' : formatCurrency(shippingFee)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border text-sm font-black text-foreground">
                    <span>Estimated Total</span>
                    <span className="text-primary">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>

                <button
                  onClick={() => setShowCheckoutModal(true)}
                  className="btn btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-md"
                >
                  <CreditCard className="w-4 h-4" /> Proceed to Checkout ({formatCurrency(grandTotal)})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="card max-w-lg w-full p-6 border-border space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" /> Delivery & Checkout
              </h3>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="text-muted hover:text-foreground text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Payment Notice banner */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Payment Notice:</strong> As real payment gateway credentials are not yet configured for this environment, your order will be created with status <span className="font-bold underline">Payment Pending</span>.
              </span>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Recipient Full Name *
                </label>
                <input
                  type="text"
                  value={shippingForm.fullName}
                  onChange={(e) => setShippingForm({ ...shippingForm, fullName: e.target.value })}
                  className="input w-full text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    value={shippingForm.phone}
                    onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })}
                    className="input w-full text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Country *
                  </label>
                  <input
                    type="text"
                    value={shippingForm.country}
                    onChange={(e) => setShippingForm({ ...shippingForm, country: e.target.value })}
                    className="input w-full text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  placeholder="123 Pet Wellness Ave, Apt 4B"
                  value={shippingForm.street}
                  onChange={(e) => setShippingForm({ ...shippingForm, street: e.target.value })}
                  className="input w-full text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    value={shippingForm.city}
                    onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                    className="input w-full text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    State / UT *
                  </label>
                  <input
                    type="text"
                    value={shippingForm.state}
                    onChange={(e) => setShippingForm({ ...shippingForm, state: e.target.value })}
                    className="input w-full text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    PIN Code *
                  </label>
                  <input
                    type="text"
                    value={shippingForm.postalCode}
                    onChange={(e) => setShippingForm({ ...shippingForm, postalCode: e.target.value })}
                    className="input w-full text-xs"
                    required
                  />
                </div>
              </div>

              <div className="p-3 bg-surface-2 rounded-xl text-xs flex justify-between font-bold text-foreground">
                <span>Total Due:</span>
                <span className="text-primary">{formatCurrency(grandTotal)}</span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="btn btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createOrderMutation.isPending}
                  className="btn btn-primary text-xs flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {createOrderMutation.isPending ? 'Confirming...' : 'Place Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
