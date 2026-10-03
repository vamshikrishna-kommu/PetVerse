import React from 'react';
import { Pill, Calendar, Repeat } from 'lucide-react';
import { differenceInDays, isPast } from 'date-fns';
import { cn } from '@/shared/utils/cn';
import type { IPrescription } from '@petverse/shared-types';

interface PrescriptionItemProps {
  prescription: { name: string; dosage: string; frequency: string; daysRemaining?: number };
  onClick?: () => void;
}

export function PrescriptionItem({ prescription, onClick }: PrescriptionItemProps) {
  const isActive = true;
  const isExpired = prescription.daysRemaining === 0;
  const daysRemaining = prescription.daysRemaining ?? null;

  return (
    <div 
      onClick={onClick}
      className={cn(
        "group flex items-start gap-4 p-4 rounded-xl border bg-white/50 dark:bg-slate-900/50 transition-all",
        onClick && "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm",
        isActive && !isExpired ? "border-slate-200 dark:border-slate-800" : "border-slate-100 dark:border-slate-800/50 opacity-75"
      )}
    >
      <div className={cn(
        "p-2.5 rounded-lg flex-shrink-0",
        isActive && !isExpired ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
      )}>
        <Pill className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h4 className="font-semibold text-slate-900 dark:text-white truncate">
            {prescription.name}
          </h4>
          {isActive && !isExpired && (
            <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
              Active
            </span>
          )}
        </div>
        
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 truncate">
          {prescription.dosage} — {prescription.frequency}
        </p>

        <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>
              {daysRemaining !== null 
                ? `${daysRemaining} days left` 
                : isExpired 
                  ? 'Expired' 
                  : 'Ongoing'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
