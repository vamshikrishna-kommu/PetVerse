import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { cn } from '@/shared/utils/cn';

interface VaccineAnalyticsChartsProps {
  data: {
    completionRate: number;
    totalDoses: number;
    completedDoses: number;
    missedDoses: number;
    reactionCount: number;
    reactionRate: number;
  };
  className?: string;
}

export function VaccineAnalyticsCharts({ data, className }: VaccineAnalyticsChartsProps) {
  const pieData = [
    { name: 'Completed', value: data.completedDoses, color: '#10b981' }, // success
    { name: 'Missed/Overdue', value: data.missedDoses, color: '#f43f5e' }, // danger
    { name: 'Upcoming', value: data.totalDoses - data.completedDoses - data.missedDoses, color: '#6366f1' }, // primary
  ].filter(d => d.value > 0);

  return (
    <div className={cn("grid md:grid-cols-2 gap-6", className)}>
      <div className="card p-5">
        <h3 className="font-bold text-sm text-muted uppercase tracking-wider mb-4">Dose Distribution</h3>
        {data.totalDoses === 0 ? (
          <div className="h-48 flex items-center justify-center opacity-50 text-sm">No data</div>
        ) : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="card p-5">
        <h3 className="font-bold text-sm text-muted uppercase tracking-wider mb-4">Key Metrics</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">Completion Rate</span>
              <span className="font-bold text-success">{data.completionRate}%</span>
            </div>
            <div className="w-full bg-surface-2 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-success h-2 rounded-full transition-all duration-1000" 
                style={{ width: `${data.completionRate}%` }} 
              />
            </div>
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">Reaction Rate</span>
              <span className="font-bold text-danger">{data.reactionRate}%</span>
            </div>
            <div className="w-full bg-surface-2 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-danger h-2 rounded-full transition-all duration-1000" 
                style={{ width: `${data.reactionRate}%` }} 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
