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
      enum: ['food', 'pharmacy', 'toys', 'accessories', 'grooming', 'bedding', 'health'] satisfies ProductCategory[],
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
    totalAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['payment_pending', 'processing', 'shipped', 'delivered', 'cancelled'] satisfies OrderStatus[],
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
      country: { type: String, required: true },
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    paymentId: { type: String },
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
