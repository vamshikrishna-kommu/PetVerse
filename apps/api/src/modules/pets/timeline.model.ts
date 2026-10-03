import mongoose, { Schema, type Document, type Model } from 'mongoose';
import type { IPetTimelineEvent, TimelineEventType } from '@petverse/shared-types';

export interface ITimelineEventDocument extends Omit<IPetTimelineEvent, '_id' | 'petId'>, Document {
  petId: mongoose.Types.ObjectId;
}

const TimelineEventSchema = new Schema<ITimelineEventDocument>(
  {
    petId: {
      type: Schema.Types.ObjectId,
      ref: 'Pet',
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        // Pet lifecycle
        'created', 'vaccinated', 'doctor_visit', 'medicine_started',
        'weight_updated', 'birthday', 'adopted', 'lost', 'found',
        'appointment', 'medical_report_added', 'qr_generated',
        // Health management
        'diagnosis_added', 'diagnosis_resolved',
        'prescription_started', 'prescription_completed', 'prescription_discontinued',
        // Medication events
        'medicine_given', 'course_completed', 'side_effect_reported',
        // Lab / imaging / surgery
        'lab_ordered', 'lab_resulted',
        'imaging_ordered', 'imaging_performed',
        'surgery_performed', 'surgery_recovered',
        // Conditions / vitals / allergies
        'condition_added', 'condition_resolved',
        'vital_logged',
        'allergy_added',
        'followup_due', 'followup_completed',
        // Vaccination events
        'vaccine_scheduled', 'vaccine_administered', 'vaccine_overdue',
        'vaccine_reaction', 'vaccine_certificate_generated',
      ] satisfies TimelineEventType[],
    },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 1000 },
    date: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: any) => {
        ret._id = (ret._id as mongoose.Types.ObjectId).toString();
        ret.petId = (ret.petId as mongoose.Types.ObjectId).toString();
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Optimize for fetching timeline events for a pet in descending order
TimelineEventSchema.index({ petId: 1, date: -1, createdAt: -1 });

export const TimelineEventModel: Model<ITimelineEventDocument> =
  mongoose.models.TimelineEvent ?? mongoose.model<ITimelineEventDocument>('TimelineEvent', TimelineEventSchema);
