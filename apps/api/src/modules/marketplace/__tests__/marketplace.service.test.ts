import mongoose from 'mongoose';
import { marketplaceService } from '../marketplace.service';
import { ProductModel, OrderModel } from '../marketplace.model';
import { UserModel } from '../../users/user.model';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../../shared/errors/AppError';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/petverse_test';

describe('Marketplace Service — Unit & Integration Tests', () => {
  let customerId: string;
  let strangerId: string;
  let productId: string;
  let createdOrderId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }

    const customer = await UserModel.create({
      email: `market_buyer_${Date.now()}@testverse.com`,
      profile: { firstName: 'Alice', lastName: 'Shopper' },
      passwordHash: 'dummyhash123',
      role: 'pet_owner',
      isVerified: true,
      isActive: true,
    });
    customerId = customer._id.toString();

    const stranger = await UserModel.create({
      email: `market_intruder_${Date.now()}@testverse.com`,
      profile: { firstName: 'Bob', lastName: 'Snoop' },
      passwordHash: 'dummyhash123',
      role: 'pet_owner',
      isVerified: true,
      isActive: true,
    });
    strangerId = stranger._id.toString();

    const product = await ProductModel.create({
      name: 'Veterinary Probiotic Chewable Tabs',
      description: 'Clinically proven daily digestive flora supplement for dogs and cats.',
      category: 'pharmacy',
      price: 999,
      currency: 'INR',
      stock: 50,
      images: ['https://images.unsplash.com/photo-probiotics.jpg'],
      rating: 4.9,
      reviewsCount: 25,
      petSpecies: ['dog', 'cat'],
      isActive: true,
    });
    productId = product._id.toString();
  });

  afterAll(async () => {
    await UserModel.deleteMany({ _id: { $in: [customerId, strangerId] } });
    await ProductModel.findByIdAndDelete(productId);
    await OrderModel.deleteMany({ userId: customerId });
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  });

  it('should list products and filter by category and species', async () => {
    const result = await marketplaceService.listProducts({
      category: 'pharmacy',
      species: 'dog',
    });

    expect(result.products.length).toBeGreaterThan(0);
    expect(result.products.some((p) => p._id.toString() === productId)).toBe(true);
  });

  it('should get product by ID', async () => {
    const product = await marketplaceService.getProductById(productId);
    expect(product._id.toString()).toBe(productId);
    expect(product.price).toBe(999);
  });

  it('should create an online order with server-calculated total', async () => {
    const order = await marketplaceService.createOrder(customerId, {
      items: [{ productId, quantity: 2 }],
      shippingAddress: {
        fullName: 'Priya Sharma',
        phone: '9876543210',
        street: '12, MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        postalCode: '560001',
        country: 'India',
      },
      paymentMethod: 'razorpay',
    });

    expect(order._id).toBeDefined();
    expect(order.items.length).toBe(1);
    expect(order.subtotal).toBe(1998); // 999 * 2
    expect(order.deliveryCharge).toBe(0); // Subtotal > 999 -> Free delivery
    expect(order.totalAmount).toBe(1998);
    expect(order.status).toBe('payment_pending');
    expect(order.paymentStatus).toBe('pending');

    createdOrderId = order._id.toString();

    // Verify stock is preserved until payment is verified (prevents cart lockups)
    const productBeforePay = await ProductModel.findById(productId);
    expect(productBeforePay?.stock).toBe(50);
  });

  it('should verify payment, mark order confirmed, and atomically decrement stock', async () => {
    const verifiedOrder = await marketplaceService.verifyRazorpayPayment(customerId, createdOrderId, {
      razorpayPaymentId: 'pay_test_' + Date.now(),
      razorpayOrderId: 'order_test_' + Date.now(),
      razorpaySignature: 'simulated_test_sig',
    });

    expect(verifiedOrder.paymentStatus).toBe('completed');
    expect(verifiedOrder.status).toBe('confirmed');

    // Stock should now be decremented from 50 to 48
    const updatedProduct = await ProductModel.findById(productId);
    expect(updatedProduct?.stock).toBe(48);
  });

  it('should list user orders', async () => {
    const orders = await marketplaceService.getMyOrders(customerId);
    expect(orders.length).toBeGreaterThan(0);
    expect(orders.some((o: any) => o._id.toString() === createdOrderId)).toBe(true);
  });

  it('should prevent unauthorized user from viewing another user’s order (IDOR protection)', async () => {
    await expect(
      marketplaceService.getOrderById(strangerId, createdOrderId, false)
    ).rejects.toThrow(ForbiddenError);
  });

  it('should allow customer to cancel eligible order and restore inventory', async () => {
    const cancelled = await marketplaceService.cancelOrder(customerId, createdOrderId, 'Ordered by mistake');
    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.cancellationReason).toBe('Ordered by mistake');

    // Stock should be restored from 48 back to 50
    const restoredProduct = await ProductModel.findById(productId);
    expect(restoredProduct?.stock).toBe(50);
  });

  it('should allow admin to list orders and update status with tracking details', async () => {
    // Create a new COD order
    const codOrder = await marketplaceService.createOrder(customerId, {
      items: [{ productId, quantity: 1 }],
      shippingAddress: {
        fullName: 'Rahul Verma',
        phone: '9876543211',
        street: '45, Jubilee Hills',
        city: 'Hyderabad',
        state: 'Telangana',
        postalCode: '500033',
        country: 'India',
      },
      paymentMethod: 'cod',
    });

    // COD order is placed immediately and stock decremented
    expect(codOrder.status).toBe('placed');
    const p1 = await ProductModel.findById(productId);
    expect(p1?.stock).toBe(49);

    // Admin updates status to shipped with AWB
    const updated = await marketplaceService.updateOrderStatus(
      codOrder._id.toString(),
      'shipped',
      {
        trackingNumber: 'DELHIVERY987654',
        courier: 'Delhivery Express',
        estimatedDelivery: '3-4 business days',
        note: 'Dispatched from Hyderabad Central Hub',
      }
    );

    expect(updated.status).toBe('shipped');
    expect(updated.trackingNumber).toBe('DELHIVERY987654');
    expect(updated.courier).toBe('Delhivery Express');
    expect(updated.timeline?.some((t: any) => t.status === 'shipped')).toBe(true);
  });

  it('should reject order if requested quantity exceeds available stock', async () => {
    await expect(
      marketplaceService.createOrder(customerId, {
        items: [{ productId, quantity: 9999 }],
        shippingAddress: {
          fullName: 'Priya Sharma',
          phone: '9876543210',
          street: '12, MG Road',
          city: 'Bengaluru',
          state: 'Karnataka',
          postalCode: '560001',
          country: 'India',
        },
      })
    ).rejects.toThrow(BadRequestError);
  });
});
