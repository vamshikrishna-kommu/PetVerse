import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';

export interface IPaymentTransactionDocument extends Document {
  _id: mongoose.Types.ObjectId;
  appointmentId: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: 'stripe' | 'razorpay' | 'payment_gateway';
  providerSessionId?: string;
  providerPaymentId?: string;
  idempotencyKey: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentTransactionSchema = new Schema<IPaymentTransactionDocument>(
  {
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    status: {
      type: String,
      enum: ['pending', 'succeeded', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    provider: {
      type: String,
      default: 'razorpay',
    },
    providerSessionId: {
      type: String,
      index: true,
    },
    providerPaymentId: {
      type: String,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        ret._id = (ret._id as mongoose.Types.ObjectId).toString();
        ret.appointmentId = (ret.appointmentId as mongoose.Types.ObjectId).toString();
        ret.ownerId = (ret.ownerId as mongoose.Types.ObjectId).toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const PaymentTransactionModel: Model<IPaymentTransactionDocument> =
  mongoose.models.PaymentTransaction ||
  mongoose.model<IPaymentTransactionDocument>('PaymentTransaction', PaymentTransactionSchema);
