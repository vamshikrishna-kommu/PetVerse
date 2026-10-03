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
    phone: z.string().min(6, 'Valid phone number is required'),
    street: z.string().min(3, 'Street address is required'),
    city: z.string().min(2, 'City is required'),
    state: z.string().min(2, 'State / Province is required'),
    postalCode: z.string().regex(/^\d{6}$/, 'PIN code must be exactly 6 digits'),
    country: z.string().min(2, 'Country is required'),
  }),
});

const productSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().min(5).max(2000),
  category: z.enum(['food', 'pharmacy', 'toys', 'accessories', 'grooming', 'bedding', 'health']),
  price: z.number().positive(),
  currency: z.string().default('INR'),
  stock: z.number().int().min(0),
  images: z.array(z.string().url()).optional(),
  petSpecies: z.array(z.string()).optional(),
});

// Catalog routes (public)
router.get('/products', marketplaceController.listProducts);
router.get('/products/:id', marketplaceController.getProductById);

// Admin product management
router.post('/products', authenticate, requireRole('admin'), validate(productSchema), marketplaceController.createProduct);
router.put('/products/:id', authenticate, requireRole('admin'), validate(productSchema.partial()), marketplaceController.updateProduct);
router.delete('/products/:id', authenticate, requireRole('admin'), marketplaceController.deleteProduct);

// Authenticated Orders
router.post('/orders', authenticate, validate(createOrderSchema), marketplaceController.createOrder);
router.get('/orders', authenticate, marketplaceController.getMyOrders);
router.get('/orders/:id', authenticate, marketplaceController.getOrderById);
router.patch(
  '/orders/:id/status',
  authenticate,
  requireRole('admin'),
  validate(z.object({ status: z.enum(['payment_pending', 'processing', 'shipped', 'delivered', 'cancelled']) })),
  marketplaceController.updateOrderStatus
);

export default router;
