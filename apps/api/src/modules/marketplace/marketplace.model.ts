import mongoose, { Schema, Document, Model } from 'mongoose';
import type { IProduct, IOrder, ProductCategory, OrderStatus, PetSpecies } from '@petverse/shared-types';

export interface IProductDocument extends Omit<IProduct, '_id'>, Document {}
export interface IOrderDocument extends Omit<IOrder, '_id'>, Document {}

const ProductSchema = new Schema<IProductDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    category: {
      type: String,
      enum: [
        'food',
        'pharmacy',
        'toys',
        'accessories',
        'grooming',
        'bedding',
        'health',
        'medicine',
        'other',
      ] satisfies ProductCategory[],
      required: true,
      index: true,
    },
    price: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR', trim: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
    images: [{ type: String }],
    rating: { type: Number, default: 4.8, min: 1, max: 5 },
    reviewsCount: { type: Number, default: 0, min: 0 },
    petSpecies: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        ret._id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ name: 'text', description: 'text' });

const OrderSchema = new Schema<IOrderDocument>(
  {
    userId: { type: String, required: true, index: true },
    items: [
      {
        productId: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        image: { type: String },
      },
    ],
    subtotal: { type: Number, default: 0 },
    deliveryCharge: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: [
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
      ] satisfies OrderStatus[],
      default: 'payment_pending',
      index: true,
    },
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, default: 'India' },
      landmark: { type: String },
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'cod', 'test'],
      default: 'razorpay',
    },
    paymentId: { type: String },
    razorpayOrderId: { type: String, index: true },
    razorpayPaymentId: { type: String },
    trackingNumber: { type: String },
    courier: { type: String },
    estimatedDelivery: { type: String },
    cancellationReason: { type: String },
    timeline: [
      {
        status: { type: String, required: true },
        timestamp: { type: String, required: true },
        note: { type: String },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        ret._id = ret._id.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

OrderSchema.index({ userId: 1, createdAt: -1 });

export const ProductModel: Model<IProductDocument> =
  mongoose.models.Product ?? mongoose.model<IProductDocument>('Product', ProductSchema);

export const OrderModel: Model<IOrderDocument> =
  mongoose.models.Order ?? mongoose.model<IOrderDocument>('Order', OrderSchema);
