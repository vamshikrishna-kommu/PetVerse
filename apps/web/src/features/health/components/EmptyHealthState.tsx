import React from 'react';
import { cn } from '@/shared/utils/cn';
import { FileHeart } from 'lucide-react';
import { motion } from 'framer-motion';

interface EmptyHealthStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ElementType;
  className?: string;
}

export function EmptyHealthState({
  title,
  description,
  action,
  icon: Icon = FileHeart,
  className,
}: EmptyHealthStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex flex-col items-center justify-center text-center p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50",
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[250px] mb-6">
        {description}
      </p>
      {action && <div>{action}</div>}
    </motion.div>
  );
}
