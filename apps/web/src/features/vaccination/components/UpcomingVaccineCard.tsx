import React from 'react';
import { Syringe, Calendar, AlertTriangle, Clock } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/shared/utils/cn';
import type { DoseType } from '@petverse/shared-types';

interface UpcomingVaccineCardProps {
  vaccineName: string;
  doseType: DoseType;
  dueDate: string;
  isOverdue: boolean;
  daysUntilDue: number;
  onRecordAction?: () => void;
  className?: string;
}

export function UpcomingVaccineCard({
  vaccineName,
  doseType,
  dueDate,
  isOverdue,
  daysUntilDue,
  onRecordAction,
  className
}: UpcomingVaccineCardProps) {
  const dateObj = new Date(dueDate);
  
  return (
    <div className={cn(
      "card p-5 border-l-4 transition-all hover:shadow-md",
      isOverdue ? "border-l-danger bg-danger/5" : 
      daysUntilDue <= 7 ? "border-l-warning bg-warning/5" : 
      "border-l-primary bg-surface",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex gap-3">
          <div className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center shrink-0",
            isOverdue ? "bg-danger/20 text-danger" : 
            daysUntilDue <= 7 ? "bg-warning/20 text-warning" : 
            "bg-primary/10 text-primary"
          )}>
            <Syringe className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-foreground capitalize">{vaccineName}</h3>
            <p className="text-sm font-medium text-muted capitalize">{doseType.replace('_', ' ')} Dose</p>
            
            <div className="flex items-center gap-4 mt-3 text-sm">
              <span className="flex items-center gap-1.5 text-muted">
                <Calendar className="h-4 w-4" />
                {format(dateObj, 'MMM d, yyyy')}
              </span>
              
              {isOverdue ? (
                <span className="flex items-center gap-1.5 text-danger font-semibold">
                  <AlertTriangle className="h-4 w-4" />
                  Overdue by {Math.abs(daysUntilDue)} days
                </span>
              ) : (
                <span className={cn("flex items-center gap-1.5 font-semibold", daysUntilDue <= 7 ? "text-warning" : "text-success")}>
                  <Clock className="h-4 w-4" />
                  Due in {daysUntilDue} days
                </span>
              )}
            </div>
          </div>
        </div>
        
        {onRecordAction && (
          <button 
            onClick={onRecordAction}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-2 transition-colors"
          >
            Record
          </button>
        )}
      </div>
    </div>
  );
}
