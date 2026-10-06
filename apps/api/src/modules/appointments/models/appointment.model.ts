import mongoose, { Schema, type Document, type Model } from 'mongoose';
import type { IAppointment } from '@petverse/shared-types';

export interface IAppointmentDocument extends Omit<IAppointment, '_id' | 'ownerId' | 'petId' | 'clinicId' | 'vetId'>, Document {
  _id: mongoose.Types.ObjectId;
  ownerId: mongoose.Types.ObjectId;
  petId: mongoose.Types.ObjectId;
  clinicId?: string | mongoose.Types.ObjectId;
  clinicName?: string;
  clinicAddress?: string;
  vetId?: mongoose.Types.ObjectId;
  appointmentDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm (e.g., "10:30")
  endTime?: string;
  cancellationReason?: string;
  reminderId?: string;
}

const AppointmentSchema = new Schema<IAppointmentDocument>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    petId: {
      type: Schema.Types.ObjectId,
      ref: 'Pet',
      required: true,
      index: true,
    },
    clinicId: {
      type: Schema.Types.Mixed,
      index: true,
    },
    clinicName: {
      type: String,
      trim: true,
    },
    clinicAddress: {
      type: String,
      trim: true,
    },
    vetId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    scheduledAt: {
      type: String,
      required: true,
    },
    appointmentDate: {
      type: String,
      required: true,
      index: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
    },
    duration: {
      type: Number,
      default: 30,
    },
    type: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'],
      default: 'scheduled',
      index: true,
    } as any,
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
    fee: {
      type: Number,
    },
    paymentStatus: {
      type: String,
      default: 'pending',
    },
    reminderId: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        ret._id = (ret._id as mongoose.Types.ObjectId).toString();
        ret.ownerId = (ret.ownerId as mongoose.Types.ObjectId).toString();
        ret.petId = (ret.petId as mongoose.Types.ObjectId).toString();
        if (ret.clinicId) ret.clinicId = ret.clinicId.toString();
        if (ret.vetId) ret.vetId = (ret.vetId as mongoose.Types.ObjectId).toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound index for double-booking conflict prevention
AppointmentSchema.index({ clinicId: 1, appointmentDate: 1, startTime: 1 });
AppointmentSchema.index({ ownerId: 1, status: 1, appointmentDate: -1 });

export const AppointmentModel: Model<IAppointmentDocument> =
  mongoose.models.Appointment || mongoose.model<IAppointmentDocument>('Appointment', AppointmentSchema);
