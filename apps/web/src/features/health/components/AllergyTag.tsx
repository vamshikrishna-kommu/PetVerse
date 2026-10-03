import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils/cn';
import { AlertOctagon, ShieldAlert } from 'lucide-react';
import type { AllergySeverity } from '@petverse/shared-types';

const allergyTagVariants = cva(
  'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold shadow-sm transition-colors',
  {
    variants: {
      severity: {
        mild: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800',
        moderate: 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800',
        severe: 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
        anaphylactic: 'bg-red-600 text-white border border-red-700 animate-pulse dark:bg-red-700 dark:border-red-600',
      },
    },
    defaultVariants: {
      severity: 'mild',
    },
  }
);

interface AllergyTagProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof allergyTagVariants> {
  severity: AllergySeverity;
  allergen: string;
}

export function AllergyTag({
  severity,
  allergen,
  className,
  ...props
}: AllergyTagProps) {
  return (
    <span className={cn(allergyTagVariants({ severity }), className)} {...props}>
      {severity === 'anaphylactic' ? (
        <AlertOctagon className="w-3.5 h-3.5" />
      ) : (
        <ShieldAlert className="w-3.5 h-3.5" />
      )}
      <span>{allergen}</span>
    </span>
  );
}
