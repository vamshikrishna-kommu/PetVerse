import { ProductModel, OrderModel } from './marketplace.model';
import { NotFoundError, BadRequestError, ForbiddenError } from '../../shared/errors/AppError';
import type { IProduct, IOrder, ProductCategory, OrderStatus, PetSpecies } from '@petverse/shared-types';

export interface ProductQueryDTO {
  category?: string;
  species?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export interface CreateOrderDTO {
  items: Array<{ productId: string; quantity: number }>;
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

export class MarketplaceService {
  async listProducts(query: ProductQueryDTO = {}): Promise<{ products: IProduct[]; total: number; page: number; totalPages: number }> {
    await this.seedInitialProductsIfEmpty();

    const filter: any = { isActive: true };

    if (query.category && query.category !== 'all') {
      filter.category = query.category;
    }

    if (query.species && query.species !== 'all') {
      filter.petSpecies = query.species;
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filter.price = {};
      if (query.minPrice !== undefined) filter.price.$gte = Number(query.minPrice);
      if (query.maxPrice !== undefined) filter.price.$lte = Number(query.maxPrice);
    }

    if (query.search && query.search.trim()) {
      const q = query.search.trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
      ];
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(50, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      ProductModel.find(filter).sort({ rating: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      ProductModel.countDocuments(filter),
    ]);

    const formatted = products.map((p: any) => ({
      ...p,
      _id: p._id.toString(),
    })) as IProduct[];

    return {
      products: formatted,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async getProductById(id: string): Promise<IProduct> {
    const product = await ProductModel.findById(id).lean();
    if (!product || !product.isActive) {
      throw new NotFoundError('Product not found or unavailable');
    }
    return {
      ...product,
      _id: product._id.toString(),
    } as IProduct;
  }

  async createProduct(data: Partial<IProduct>): Promise<IProduct> {
    const product = await ProductModel.create(data);
    return product.toJSON() as unknown as IProduct;
  }

  async updateProduct(id: string, data: Partial<IProduct>): Promise<IProduct> {
    const product = await ProductModel.findByIdAndUpdate(id, data, { new: true });
    if (!product) throw new NotFoundError('Product not found');
    return product.toJSON() as unknown as IProduct;
  }

  async deleteProduct(id: string): Promise<void> {
    const product = await ProductModel.findById(id);
    if (!product) throw new NotFoundError('Product not found');
    product.isActive = false;
    await product.save();
  }

  async createOrder(userId: string, data: CreateOrderDTO): Promise<IOrder> {
    if (!data.items || data.items.length === 0) {
      throw new BadRequestError('Order must contain at least one item');
    }

    let calculatedTotal = 0;
    const validatedItems = [];

    // Verify stock and calculate server-side pricing
    for (const item of data.items) {
      const product = await ProductModel.findById(item.productId);
      if (!product || !product.isActive) {
        throw new NotFoundError(`Product ${item.productId} is no longer available`);
      }
      if (product.stock < item.quantity) {
        throw new BadRequestError(`Insufficient stock for "${product.name}". Available: ${product.stock}`);
      }

      const itemTotal = product.price * item.quantity;
      calculatedTotal += itemTotal;

      validatedItems.push({
        productId: product._id.toString(),
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.images?.[0],
      });

      // Deduct inventory
      product.stock -= item.quantity;
      await product.save();
    }

    const order = await OrderModel.create({
      userId,
      items: validatedItems,
      totalAmount: Math.round(calculatedTotal * 100) / 100,
      currency: 'INR',
      status: 'payment_pending',
      shippingAddress: data.shippingAddress,
      paymentStatus: 'pending',
    });

    return order.toJSON() as unknown as IOrder;
  }

  async getMyOrders(userId: string): Promise<IOrder[]> {
    const orders = await OrderModel.find({ userId }).sort({ createdAt: -1 }).lean();
    return orders.map((o: any) => ({
      ...o,
      _id: o._id.toString(),
    })) as IOrder[];
  }

  async getOrderById(userId: string, orderId: string, isAdmin = false): Promise<IOrder> {
    const order = await OrderModel.findById(orderId).lean();
    if (!order) throw new NotFoundError('Order not found');
    if (order.userId !== userId && !isAdmin) {
      throw new ForbiddenError('Unauthorized to inspect this order');
    }
    return {
      ...order,
      _id: order._id.toString(),
    } as IOrder;
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<IOrder> {
    const order = await OrderModel.findByIdAndUpdate(orderId, { status }, { new: true });
    if (!order) throw new NotFoundError('Order not found');
    return order.toJSON() as unknown as IOrder;
  }

  private async seedInitialProductsIfEmpty(): Promise<void> {
    const count = await ProductModel.countDocuments();
    if (count > 0) return;

    const initialProducts: Array<Partial<IProduct>> = [
      {
        name: 'Drools Veterinary Probiotic Daily Chews (60ct)',
        description: 'Clinically formulated digestive support with live CFU strains for dogs & cats experiencing digestive upset or post-antibiotic care.',
        category: 'pharmacy',
        price: 899,
        currency: 'INR',
        stock: 120,
        images: ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80'],
        rating: 4.9,
        reviewsCount: 84,
        petSpecies: ['dog', 'cat'],
        isActive: true,
      },
      {
        name: 'Orthopedic Memory Foam Pet Bed (Large)',
        description: 'High-density therapeutic orthopedic foam provides joint relief and restful sleep for senior pets and growing companions.',
        category: 'bedding',
        price: 2499,
        currency: 'INR',
        stock: 45,
        images: ['https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?w=600&auto=format&fit=crop&q=80'],
        rating: 4.8,
        reviewsCount: 42,
        petSpecies: ['dog'],
        isActive: true,
      },
      {
        name: 'Royal Canin Veterinary GI Dry Kibble (3 kg)',
        description: 'Veterinary authorized high-fiber gastrointestinal microbiome care food proven to activate healthy bowel regularities. Available across major Indian cities.',
        category: 'food',
        price: 2800,
        currency: 'INR',
        stock: 35,
        images: ['https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600&auto=format&fit=crop&q=80'],
        rating: 4.9,
        reviewsCount: 112,
        petSpecies: ['dog', 'cat'],
        isActive: true,
      },
      {
        name: 'Stainless Steel Deshedding Undercoat Comb',
        description: 'Gentle ergonomic grooming rake gently extracts loose undercoat and prevents painful mats without irritating sensitive pet skin. Ideal for Indian climate.',
        category: 'grooming',
        price: 599,
        currency: 'INR',
        stock: 80,
        images: ['https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=600&auto=format&fit=crop&q=80'],
        rating: 4.7,
        reviewsCount: 56,
        petSpecies: ['dog', 'cat', 'rabbit'],
        isActive: true,
      },
      {
        name: 'Reflective Safety Collar with Quick-Release Buckle',
        description: 'High-visibility reflective stitching collar with durable zinc-alloy D-ring for collar tags and leash attachments.',
        category: 'accessories',
        price: 449,
        currency: 'INR',
        stock: 150,
        images: ['https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=600&auto=format&fit=crop&q=80'],
        rating: 4.8,
        reviewsCount: 68,
        petSpecies: ['dog', 'cat'],
        isActive: true,
      },
      {
        name: 'Interactive Mental Enrichment Puzzle Toy',
        description: 'Level 2 treat puzzle that stimulates cognitive health, reduces destructive anxiety, and slows down fast eaters.',
        category: 'toys',
        price: 699,
        currency: 'INR',
        stock: 65,
        images: ['https://images.unsplash.com/photo-1535294435445-d7249524ef2e?w=600&auto=format&fit=crop&q=80'],
        rating: 4.6,
        reviewsCount: 39,
        petSpecies: ['dog', 'cat'],
        isActive: true,
      },
    ];

    await ProductModel.insertMany(initialProducts);
  }
}

export const marketplaceService = new MarketplaceService();
