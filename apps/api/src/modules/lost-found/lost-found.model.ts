import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface ILostFoundInquiry {
  _id?: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderName: string;
  message: string;
  contactInfo?: string;
  createdAt: Date;
}

export interface ILostFoundReportDocument extends Document {
  _id: mongoose.Types.ObjectId;
  type: 'lost' | 'found';
  petId?: mongoose.Types.ObjectId;
  petName?: string;
  species: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other';
  breed?: string;
  color?: string;
  gender?: 'male' | 'female' | 'unknown';
  reporterId: mongoose.Types.ObjectId;
  reporterName: string;
  contactMethod: 'in_app' | 'phone' | 'email';
  contactPhone?: string;
  contactEmail?: string;
  location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
    address: string;
    city?: string;
  };
  eventDate: string; // YYYY-MM-DD
  description: string;
  photos: string[];
  status: 'active' | 'resolved' | 'archived';
  moderationStatus: 'approved' | 'pending' | 'flagged' | 'rejected';
  inquiries: ILostFoundInquiry[];
  createdAt: Date;
  updatedAt: Date;
}

const LostFoundReportSchema = new Schema<ILostFoundReportDocument>(
  {
    type: {
      type: String,
      enum: ['lost', 'found'],
      required: true,
      index: true,
    },
    petId: {
      type: Schema.Types.ObjectId,
      ref: 'Pet',
      index: true,
    },
    petName: { type: String, trim: true },
    species: {
      type: String,
      enum: ['dog', 'cat', 'bird', 'rabbit', 'other'],
      required: true,
      index: true,
    },
    breed: { type: String, trim: true },
    color: { type: String, trim: true },
    gender: {
      type: String,
      enum: ['male', 'female', 'unknown'],
      default: 'unknown',
    },
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reporterName: { type: String, required: true, trim: true },
    contactMethod: {
      type: String,
      enum: ['in_app', 'phone', 'email'],
      default: 'in_app',
    },
    contactPhone: { type: String, select: false },
    contactEmail: { type: String, select: false },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
      },
      address: { type: String, required: true, trim: true },
      city: { type: String, trim: true },
    },
    eventDate: { type: String, required: true },
    description: { type: String, required: true, trim: true },
    photos: [{ type: String }],
    status: {
      type: String,
      enum: ['active', 'resolved', 'archived'],
      default: 'active',
      index: true,
    },
    moderationStatus: {
      type: String,
      enum: ['approved', 'pending', 'flagged', 'rejected'],
      default: 'approved',
      index: true,
    },
    inquiries: [
      {
        senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        senderName: { type: String, required: true },
        message: { type: String, required: true, trim: true },
        contactInfo: { type: String, trim: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        ret._id = ret._id.toString();
        ret.reporterId = ret.reporterId.toString();
        if (ret.petId) ret.petId = ret.petId.toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

LostFoundReportSchema.index({ location: '2dsphere' });
LostFoundReportSchema.index({ status: 1, type: 1, species: 1, createdAt: -1 });

export const LostFoundReportModel: Model<ILostFoundReportDocument> =
  mongoose.models.LostFoundReport ||
  mongoose.model<ILostFoundReportDocument>('LostFoundReport', LostFoundReportSchema);
