import mongoose, { Schema, Document, Model } from 'mongoose';
import type { IExpense, ExpenseCategory } from '@petverse/shared-types';

export interface IExpenseDocument extends Omit<IExpense, '_id'>, Document {}

const ExpenseSchema = new Schema<IExpenseDocument>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    petId: {
      type: String,
      index: true,
    },
    petName: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'veterinary',
        'medication',
        'vaccination',
        'food',
        'grooming',
        'accessories',
        'insurance',
        'emergency',
        'other',
        'toys',
        'medicine',
        'vet',
      ] satisfies ExpenseCategory[],
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    clinicName: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    receiptUrl: {
      type: String,
      trim: true,
    },
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

// Composite indexes for fast timeline and aggregate queries
ExpenseSchema.index({ userId: 1, date: -1 });
ExpenseSchema.index({ userId: 1, category: 1 });
ExpenseSchema.index({ userId: 1, petId: 1 });

export const ExpenseModel: Model<IExpenseDocument> =
  mongoose.models.Expense ?? mongoose.model<IExpenseDocument>('Expense', ExpenseSchema);
