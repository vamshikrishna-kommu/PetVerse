import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';
import { cn } from '@/shared/utils/cn';
import type { IVitalLog } from '@petverse/shared-types';

interface VitalChartProps {
  data: IVitalLog[];
  dataKey: keyof IVitalLog;
  color?: string;
  unit?: string;
  className?: string;
}

export function VitalChart({
  data,
  dataKey,
  color = '#6366f1',
  unit = '',
  className,
}: VitalChartProps) {
  // Sort data chronologically and format for recharts
  const chartData = React.useMemo(() => {
    return [...data]
      .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime())
      .filter((item) => item[dataKey] !== undefined)
      .map((item) => ({
        date: format(new Date(item.recordedAt), 'MMM dd'),
        fullDate: format(new Date(item.recordedAt), 'PPp'),
        value: item[dataKey],
      }));
  }, [data, dataKey]);

  if (chartData.length === 0) {
    return (
      <div className={cn("flex items-center justify-center h-48 bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800", className)}>
        <p className="text-sm text-slate-500">No data available for this metric.</p>
      </div>
    );
  }

  return (
    <div className={cn("h-48 w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-slate-200)" opacity={0.5} />
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: 'var(--color-slate-500)' }}
            dy={10}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: 'var(--color-slate-500)' }}
            domain={['auto', 'auto']}
            dx={-10}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-lg p-3 text-sm">
                    <p className="font-medium text-slate-900 dark:text-white mb-1">
                      {payload[0].payload.fullDate}
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      Value: <span className="font-semibold text-slate-900 dark:text-white">{payload[0].value}</span> {unit}
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={3}
            dot={{ r: 4, strokeWidth: 2, fill: 'var(--color-white)' }}
            activeDot={{ r: 6, strokeWidth: 0, fill: color }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
