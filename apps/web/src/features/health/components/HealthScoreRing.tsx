import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/shared/utils/cn';
import { HeartPulse } from 'lucide-react';

interface HealthScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function HealthScoreRing({
  score,
  size = 120,
  strokeWidth = 8,
  className,
}: HealthScoreRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  let colorClass = 'text-green-500';
  if (score < 60) colorClass = 'text-red-500';
  else if (score < 80) colorClass = 'text-yellow-500';

  return (
    <div className={cn("relative flex items-center justify-center", className)} style={{ width: size, height: size }}>
      {/* Background Ring */}
      <svg className="absolute inset-0 transform -rotate-90" width={size} height={size}>
        <circle
          className="text-slate-100 dark:text-slate-800 transition-colors"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Animated Progress Ring */}
        <motion.circle
          className={colorClass}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      
      {/* Inner Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <HeartPulse className={cn("w-5 h-5 mb-0.5", colorClass, "opacity-80")} />
        <motion.span 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white"
        >
          {score}
        </motion.span>
      </div>
    </div>
  );
}
