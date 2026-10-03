import React from 'react';
import { FileBadge, Download, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/shared/utils/cn';
import type { IVaccinationCertificate } from '@petverse/shared-types';

interface VaccineCertificateCardProps {
  certificate: IVaccinationCertificate;
  className?: string;
}

export function VaccineCertificateCard({ certificate, className }: VaccineCertificateCardProps) {
  const isRevoked = certificate.status === 'revoked';
  const isExpired = certificate.status === 'expired';
  
  return (
    <div className={cn(
      "card p-5 relative overflow-hidden transition-all hover:border-primary/30",
      isRevoked && "opacity-60 grayscale",
      className
    )}>
      {/* Background decoration */}
      <div className="absolute -right-4 -top-4 opacity-5">
        <FileBadge className="h-32 w-32" />
      </div>
      
      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className={cn(
            "h-12 w-12 rounded-xl flex items-center justify-center",
            isRevoked ? "bg-slate-200 text-slate-500" :
            isExpired ? "bg-warning/10 text-warning" :
            "bg-indigo-500/10 text-indigo-500"
          )}>
            <FileBadge className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Digital Certificate</h3>
            <p className="text-xs font-mono text-muted">ID: {certificate.certificateNumber}</p>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          {isRevoked ? (
            <span className="badge bg-danger/10 text-danger border-danger/20 flex items-center gap-1">
              <XCircle className="h-3 w-3" /> Revoked
            </span>
          ) : isExpired ? (
            <span className="badge bg-warning/10 text-warning border-warning/20 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" /> Expired
            </span>
          ) : (
            <span className="badge bg-success/10 text-success border-success/20 flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> Valid
            </span>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 my-4 relative z-10 text-sm">
        <div>
          <p className="text-xs text-muted uppercase tracking-wider mb-1">Issued By</p>
          <p className="font-medium text-foreground">{certificate.issuedByClinicName}</p>
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-wider mb-1">Issued Date</p>
          <p className="font-medium text-foreground">{format(new Date(certificate.issuedDate), 'MMM d, yyyy')}</p>
        </div>
      </div>
      
      <div className="flex gap-2 mt-4 pt-4 border-t border-border relative z-10">
        <button 
          onClick={() => window.open(certificate.verificationUrl, '_blank')}
          className="flex-1 text-sm font-semibold text-center py-2 rounded-lg bg-surface-2 hover:bg-surface-3 transition-colors text-foreground"
        >
          Verify Online
        </button>
        {certificate.pdfUrl && (
          <button 
            onClick={() => window.open(certificate.pdfUrl, '_blank')}
            className="flex-1 text-sm font-semibold text-center py-2 rounded-lg bg-indigo-500 hover:bg-indigo-600 transition-colors text-white flex items-center justify-center gap-2"
          >
            <Download className="h-4 w-4" /> Download PDF
          </button>
        )}
      </div>
    </div>
  );
}
