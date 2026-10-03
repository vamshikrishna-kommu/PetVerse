import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/utils/cn';
import { HEALTH_SEVERITY_LABELS } from '@petverse/shared-constants';
import { Activity, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import type { HealthSeverity } from '@petverse/shared-types';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors',
  {
    variants: {
      severity: {
        mild: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/50 dark:text-green-300 dark:border-green-800',
        moderate: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-300 dark:border-yellow-800',
        severe: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800',
        critical: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-800',
      },
    },
    defaultVariants: {
      severity: 'mild',
    },
  }
);

interface ConditionBadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  severity: HealthSeverity;
  name: string;
  showIcon?: boolean;
}

const severityIcons = {
  mild: Info,
  moderate: Activity,
  severe: AlertTriangle,
  critical: CheckCircle2,
};

export function ConditionBadge({
  severity,
  name,
  showIcon = true,
  className,
  ...props
}: ConditionBadgeProps) {
  const Icon = severityIcons[severity];
  
  return (
    <span className={cn(badgeVariants({ severity }), className)} {...props}>
      {showIcon && <Icon className="w-3.5 h-3.5" />}
      <span>{name}</span>
    </span>
  );
}
