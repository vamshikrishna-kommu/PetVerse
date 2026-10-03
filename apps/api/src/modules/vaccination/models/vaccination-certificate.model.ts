import { Schema, model, Document, Types } from 'mongoose';
import type { IVaccinationCertificate } from '@petverse/shared-types';

export interface IVaccinationCertificateDocument extends Omit<IVaccinationCertificate, '_id' | 'petId' | 'vaccinationRecordIds' | 'issuedByVetId' | 'createdBy' | 'updatedBy' | 'deletedBy'>, Document {
  petId: Types.ObjectId;
  vaccinationRecordIds: Types.ObjectId[];
  issuedByVetId?: Types.ObjectId;
  createdBy: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  deletedBy?: Types.ObjectId;
}

const vaccinationCertificateSchema = new Schema<IVaccinationCertificateDocument>(
  {
    petId: { type: Schema.Types.ObjectId, ref: 'Pet', required: true, index: true },
    vaccinationRecordIds: [{ type: Schema.Types.ObjectId, ref: 'VaccinationRecord', required: true }],
    
    certificateNumber: { type: String, required: true, unique: true },
    issuedDate: { type: String, required: true },
    validUntilDate: { type: String },
    
    issuedByVetId: { type: Schema.Types.ObjectId, ref: 'User' },
    issuedByClinicName: { type: String, required: true },
    
    qrCodeUrl: { type: String, required: true },
    verificationUrl: { type: String, required: true },
    pdfUrl: { type: String },
    digitalSignature: { type: String },
    
    status: { type: String, required: true, enum: ['active', 'revoked', 'expired'] },
    
    // Audit fields
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: String },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    version: { type: Number, default: 1 }
  },
  { timestamps: true }
);

export const VaccinationCertificate = model<IVaccinationCertificateDocument>('VaccinationCertificate', vaccinationCertificateSchema);
