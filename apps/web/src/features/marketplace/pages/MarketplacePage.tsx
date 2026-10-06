import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShoppingBag,
  Search,
  Star,
  Plus,
  Minus,
  Trash2,
  Package,
  Truck,
  X,
  CreditCard,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import {
  useMarketplaceProducts,
  useMyOrders,
} from '../hooks/useMarketplace';
import { useMarketplaceCartStore } from '../store/cart.store';
import { useAuthStore } from '@/app/store/auth.store';
import type { IProduct } from '@petverse/shared-types';
import { toast } from 'sonner';
import { formatCurrency } from '@/shared/utils/cn';

const CATEGORIES: { id: string; label: string }[] = [
  { id: 'all', label: 'All Items' },
  { id: 'food', label: 'Food & Nutrition' },
  { id: 'grooming', label: 'Grooming & Hygiene' },
  { id: 'toys', label: 'Toys & Enrichment' },
  { id: 'accessories', label: 'Collars & Leashes' },
  { id: 'bedding', label: 'Beds & Mats' },
  { id: 'pharmacy', label: 'Healthcare & Pharma' },
];

const SPECIES_TABS: { id: string; label: string; icon: string }[] = [
  { id: 'all', label: 'All Pets', icon: '🐾' },
  { id: 'dog', label: 'Dogs', icon: '🐶' },
  { id: 'cat', label: 'Cats', icon: '🐱' },
  { id: 'bird', label: 'Birds', icon: '🦜' },
  { id: 'rabbit', label: 'Small Pets', icon: '🐰' },
];

export default function MarketplacePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'catalog' | 'orders'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSpecies, setSelectedSpecies] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'rating'>('featured');

  // Cart store
  const {
    items: cartItems,
    isCartOpen,
    openCart,
    closeCart,
    addItem,
    removeItem,
    updateQuantity,
    getTotalCount,
    getTotalPrice,
  } = useMarketplaceCartStore();

  // Queries
  const { data: catalogData, isLoading: productsLoading } = useMarketplaceProducts({
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    species: selectedSpecies !== 'all' ? selectedSpecies : undefined,
    search: searchQuery.trim() || undefined,
  });

  const { data: myOrders, isLoading: ordersLoading } = useMyOrders();

  const handleAddToCart = (product: IProduct) => {
    if (product.stock <= 0) {
      toast.error('Item is currently out of stock');
      return;
    }
    addItem(product, 1);
    toast.success(`Added "${product.name}" to cart`);
  };

  const handleBuyNow = (product: IProduct) => {
    if (product.stock <= 0) {
      toast.error('Item is currently out of stock');
      return;
    }
    addItem(product, 1);
    closeCart();
    navigate('/marketplace/checkout');
  };

  const cartTotal = getTotalPrice();
  const deliveryCharge = cartTotal > 999 || cartTotal === 0 ? 0 : 49;
  const grandTotal = cartTotal + deliveryCharge;

  // Filter & sort products locally if needed
  const displayProducts = useMemo(() => {
    if (!catalogData?.products) return [];
    let list = [...catalogData.products];

    if (sortBy === 'price_asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    return list;
  }, [catalogData?.products, sortBy]);

  return (
    <div className="container-page max-w-7xl py-8 space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 p-6 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> India-First Pet Marketplace
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight flex items-center gap-3">
              <ShoppingBag className="w-9 h-9 text-primary" /> PetVerse Store
            </h1>
            <p className="text-muted text-sm sm:text-base max-w-2xl">
              Authentic veterinary-approved nutrition, pharmaceutical essentials, and premium lifestyle gear with fast pan-India delivery.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/orders"
              className="btn btn-secondary text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm"
            >
              <Package className="w-4 h-4 text-primary" />
              <span>My Orders</span>
              {myOrders && myOrders.length > 0 && (
                <span className="badge bg-primary/15 text-primary text-[11px] font-bold">
                  {myOrders.length}
                </span>
              )}
            </Link>

            <button
              onClick={openCart}
              className="btn btn-primary text-xs sm:text-sm font-semibold relative flex items-center gap-2 shadow-lg shadow-primary/25"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Cart</span>
              {getTotalCount() > 0 && (
                <span className="w-5 h-5 bg-white text-primary text-[11px] font-black rounded-full flex items-center justify-center shadow">
                  {getTotalCount()}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex bg-surface-2 p-1 rounded-xl border border-border text-xs sm:text-sm">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              activeTab === 'catalog'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            Explore Catalog
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              activeTab === 'orders'
                ? 'bg-primary text-white shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            Recent Orders ({myOrders?.length || 0})
          </button>
        </div>

        {activeTab === 'catalog' && (
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>100% Genuine Products • Free Delivery &gt; ₹999</span>
          </div>
        )}
      </div>

      {/* TAB 1: CATALOG */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* Species Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {SPECIES_TABS.map((species) => (
              <button
                key={species.id}
                onClick={() => setSelectedSpecies(species.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition whitespace-nowrap border ${
                  selectedSpecies === species.id
                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/20'
                    : 'bg-surface-2 text-muted border-border hover:bg-surface-3 hover:text-foreground'
                }`}
              >
                <span>{species.icon}</span>
                <span>{species.label}</span>
              </button>
            ))}
          </div>

          {/* Category Bar & Search */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-xl font-medium transition whitespace-nowrap ${
                    selectedCategory === cat.id
                      ? 'bg-surface-3 text-foreground font-bold border border-border shadow-sm'
                      : 'bg-surface-2 text-muted hover:bg-surface-3 hover:text-foreground'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 text-muted absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search food, treats, toys..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input w-full pl-9 py-2 text-xs"
                />
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort products by"
                className="input py-2 text-xs font-medium cursor-pointer"
              >
                <option value="featured">Featured</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {productsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="card h-80 animate-pulse bg-surface-2/60" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayProducts.map((product) => (
                <div
                  key={product._id}
                  className="card overflow-hidden border-border hover:border-primary/50 transition-all duration-200 flex flex-col justify-between shadow-sm hover:shadow-md group"
                >
                  <div>
                    <div className="relative h-52 bg-surface-3 overflow-hidden">
                      <img
                        src={product.images?.[0] || 'https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?w=600&auto=format&fit=crop&q=80'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        loading="lazy"
                      />
                      <span className="absolute top-3 left-3 badge bg-black/60 text-white backdrop-blur-sm border-0 text-[10px] font-bold uppercase tracking-wider">
                        {product.category}
                      </span>
                      {product.stock <= 5 && product.stock > 0 && (
                        <span className="absolute bottom-3 right-3 badge bg-amber-500 text-white border-0 text-[10px] font-bold">
                          Only {product.stock} left
                        </span>
                      )}
                      {product.stock === 0 && (
                        <span className="absolute bottom-3 right-3 badge bg-rose-500 text-white border-0 text-[10px] font-bold">
                          Out of Stock
                        </span>
                      )}
                    </div>

                    <div className="p-5 space-y-2.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{product.rating || 4.5}</span>
                          <span className="text-muted font-normal text-[11px]">
                            ({product.reviewsCount || 12})
                          </span>
                        </div>
                        {product.petSpecies && product.petSpecies.length > 0 && (
                          <div className="flex gap-1">
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

                      <h3 className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition">
                        {product.name}
                      </h3>

                      <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    </div>
                  </div>

                  <div className="p-5 pt-0 border-t border-border mt-3 space-y-3">
                    <div className="flex items-baseline justify-between pt-3">
                      <div>
                        <span className="text-[10px] text-muted block uppercase font-bold tracking-wider">Price</span>
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-extrabold text-foreground">
                            {formatCurrency(product.price)}
                          </span>
                          {product.price > 500 && (
                            <span className="text-xs text-muted line-through">
                              {formatCurrency(Math.round(product.price * 1.15))}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="text-[11px] text-emerald-600 font-medium">
                        {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock <= 0}
                        className="btn btn-secondary text-xs flex items-center justify-center gap-1 font-semibold"
                      >
                        <Plus className="w-3.5 h-3.5" /> Cart
                      </button>

                      <button
                        onClick={() => handleBuyNow(product)}
                        disabled={product.stock <= 0}
                        className="btn btn-primary text-xs flex items-center justify-center gap-1 font-bold shadow-sm"
                      >
                        Buy Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty products state */}
          {displayProducts.length === 0 && !productsLoading && (
            <div className="card p-12 text-center border-border space-y-3">
              <ShoppingBag className="w-12 h-12 text-muted mx-auto opacity-40" />
              <h3 className="text-base font-bold text-foreground">No Products Found</h3>
              <p className="text-xs text-muted max-w-sm mx-auto">
                No items match your filter criteria. Try adjusting species, category, or search keywords.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedSpecies('all');
                  setSearchQuery('');
                }}
                className="btn btn-secondary text-xs"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY ORDERS PREVIEW */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">Recent Orders</h2>
              <p className="text-xs text-muted">View past purchases and real-time shipment updates</p>
            </div>
            <Link to="/orders" className="btn btn-primary text-xs flex items-center gap-2">
              <span>View All Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {myOrders?.map((order) => (
              <div key={order._id} className="card p-6 border-border space-y-4 shadow-sm hover:border-primary/40 transition">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">
                        Order #{order._id.slice(-8).toUpperCase()}
                      </span>
                      <span
                        className={`badge text-[10px] font-bold uppercase tracking-wider ${
                          order.status === 'delivered'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : order.status === 'shipped' || order.status === 'out_for_delivery'
                            ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                            : order.status === 'cancelled'
                            ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        }`}
                      >
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className="text-xs text-muted">
                      Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs text-muted block">Order Total</span>
                      <span className="text-base font-black text-foreground">
                        {formatCurrency(order.totalAmount)}
                      </span>
                    </div>
                    <Link
                      to={`/orders/${order._id}`}
                      className="btn btn-primary text-xs flex items-center gap-1.5 font-bold"
                    >
                      <span>Track Order</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
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
                <div className="pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-muted gap-2">
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-primary" />
                    <span>
                      Shipping to: {order.shippingAddress.street}, {order.shippingAddress.city},{' '}
                      {order.shippingAddress.state} - {order.shippingAddress.postalCode}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="capitalize font-semibold text-foreground">
                      Payment: {order.paymentStatus}
                    </span>
                    {order.trackingNumber && (
                      <span className="badge bg-primary/10 text-primary text-[10px] font-mono">
                        AWB: {order.trackingNumber}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {(!myOrders || myOrders.length === 0) && !ordersLoading && (
              <div className="card p-12 text-center border-border space-y-3">
                <Package className="w-12 h-12 text-muted mx-auto opacity-40" />
                <h3 className="text-base font-bold text-foreground">No Orders Yet</h3>
                <p className="text-xs text-muted max-w-sm mx-auto">
                  When you purchase pet essentials or diets, your order tracking will appear here.
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
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
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
                      {deliveryCharge === 0 ? 'FREE (Orders > ₹999)' : formatCurrency(deliveryCharge)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border text-sm font-black text-foreground">
                    <span>Estimated Total</span>
                    <span className="text-primary">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    closeCart();
                    navigate('/marketplace/checkout');
                  }}
                  className="btn btn-primary w-full py-3 text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-primary/20"
                >
                  <CreditCard className="w-4 h-4" /> Proceed to Checkout ({formatCurrency(grandTotal)})
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
