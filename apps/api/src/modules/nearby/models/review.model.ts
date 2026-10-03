import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface IReviewDocument extends Document {
  _id: mongoose.Types.ObjectId;
  targetId: mongoose.Types.ObjectId; // Clinic or provider ID
  userId: mongoose.Types.ObjectId;
  userName: string;
  userAvatar?: string;
  rating: number; // 1-5
  comment: string;
  appointmentId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReviewDocument>(
  {
    targetId: {
      type: Schema.Types.ObjectId,
      ref: 'Clinic',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userAvatar: {
      type: String,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Appointment',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        ret._id = (ret._id as mongoose.Types.ObjectId).toString();
        ret.targetId = (ret.targetId as mongoose.Types.ObjectId).toString();
        ret.userId = (ret.userId as mongoose.Types.ObjectId).toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Prevent duplicate review per user for same target
ReviewSchema.index({ targetId: 1, userId: 1 }, { unique: true });

export const ReviewModel: Model<IReviewDocument> =
  mongoose.models.Review || mongoose.model<IReviewDocument>('Review', ReviewSchema);
