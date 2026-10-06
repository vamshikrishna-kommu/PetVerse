import { Router } from 'express';
import { marketplaceController } from './marketplace.controller';
import { authenticate, requireRole } from '../../middlewares/auth.middleware';
import { z } from 'zod';
import { validate } from '../../middlewares/validate.middleware';

const router: Router = Router();

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1, 'Product ID is required'),
        quantity: z.number().int().positive('Quantity must be at least 1'),
      })
    )
    .min(1, 'Order must contain at least one item'),
  shippingAddress: z.object({
    fullName: z.string().min(2, 'Full name is required'),
    phone: z.string().min(10, 'Valid 10-digit phone number is required'),
    street: z.string().min(3, 'Street address is required'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State is required'),
    postalCode: z.string().regex(/^\d{6}$/, 'PIN code must be exactly 6 digits'),
    country: z.string().optional(),
    landmark: z.string().optional(),
  }),
  paymentMethod: z.enum(['razorpay', 'cod', 'test']).optional(),
});

const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1, 'Razorpay order ID is required'),
  razorpayPaymentId: z.string().min(1, 'Razorpay payment ID is required'),
  razorpaySignature: z.string().min(1, 'Razorpay signature is required'),
});

const cancelOrderSchema = z.object({
  reason: z.string().optional(),
});

const updateOrderStatusSchema = z.object({
  status: z.enum([
    'payment_pending',
    'placed',
    'confirmed',
    'processing',
    'packed',
    'shipped',
    'out_for_delivery',
    'delivered',
    'cancelled',
    'payment_failed',
    'refunded',
  ]),
  trackingNumber: z.string().optional(),
  courier: z.string().optional(),
  estimatedDelivery: z.string().optional(),
  note: z.string().optional(),
});

const productSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().min(5).max(2000),
  category: z.enum([
    'food',
    'pharmacy',
    'toys',
    'accessories',
    'grooming',
    'bedding',
    'health',
    'medicine',
    'other',
  ]),
  price: z.number().positive(),
  currency: z.string().default('INR'),
  stock: z.number().int().min(0),
  images: z.array(z.string().url()).optional(),
  petSpecies: z.array(z.string()).optional(),
});

// ─── Public Catalog Routes ──────────────────────────────────
router.get('/products', marketplaceController.listProducts);
router.get('/products/:id', marketplaceController.getProductById);

// ─── Admin Product Management ───────────────────────────────
router.post(
  '/products',
  authenticate,
  requireRole('admin'),
  validate(productSchema),
  marketplaceController.createProduct
);
router.put(
  '/products/:id',
  authenticate,
  requireRole('admin'),
  validate(productSchema.partial()),
  marketplaceController.updateProduct
);
router.delete(
  '/products/:id',
  authenticate,
  requireRole('admin'),
  marketplaceController.deleteProduct
);

// ─── Customer Orders ────────────────────────────────────────
router.post(
  '/orders',
  authenticate,
  validate(createOrderSchema),
  marketplaceController.createOrder
);
router.get('/orders', authenticate, marketplaceController.getMyOrders);
router.get('/orders/:id', authenticate, marketplaceController.getOrderById);
router.post(
  '/orders/:id/verify-payment',
  authenticate,
  validate(verifyPaymentSchema),
  marketplaceController.verifyRazorpayPayment
);
router.post(
  '/orders/:id/cancel',
  authenticate,
  validate(cancelOrderSchema),
  marketplaceController.cancelOrder
);

// ─── Admin Order Management ─────────────────────────────────
router.get(
  '/admin/orders',
  authenticate,
  requireRole('admin'),
  marketplaceController.listAdminOrders
);
router.patch(
  '/admin/orders/:id/status',
  authenticate,
  requireRole('admin'),
  validate(updateOrderStatusSchema),
  marketplaceController.updateOrderStatus
);

export default router;
