import React from 'react';
import { format } from 'date-fns';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import type { IVaccinationSchedule } from '@petverse/shared-types';

interface VaccinationTimelineProps {
  schedule: IVaccinationSchedule;
  className?: string;
}

export function VaccinationTimeline({ schedule, className }: VaccinationTimelineProps) {
  // Combine and sort events
  const allEvents = [
    ...schedule.completedVaccines.map(v => ({
      id: `${v.vaccineId}-${v.date}`,
      name: v.vaccineName,
      date: new Date(v.date),
      status: 'completed' as const,
      doseType: 'completed',
    })),
    ...schedule.upcomingVaccines.map(v => ({
      id: `${v.vaccineId}-${v.dueDate}`,
      name: v.vaccineName,
      date: new Date(v.dueDate),
      status: v.isOverdue ? 'overdue' as const : 'upcoming' as const,
      doseType: v.doseType,
      isOverdue: v.isOverdue,
      daysUntilDue: v.daysUntilDue,
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()); // Newest first

  if (allEvents.length === 0) {
    return (
      <div className={cn("text-center py-8 opacity-60", className)}>
        <p className="font-medium text-sm">No vaccination history found.</p>
      </div>
    );
  }

  return (
    <div className={cn("relative space-y-0", className)}>
      {/* Vertical line connecting timeline items */}
      <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-border rounded-full" />
      
      {allEvents.map((event, index) => (
        <div key={event.id} className="relative flex items-start gap-4 py-3 group">
          {/* Timeline Icon */}
          <div className="relative z-10 bg-surface py-1">
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center border-2",
              event.status === 'completed' ? "bg-success/10 border-success text-success" :
              event.status === 'overdue' ? "bg-danger/10 border-danger text-danger" :
              "bg-surface-2 border-primary text-primary"
            )}>
              {event.status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> :
               event.status === 'overdue' ? <AlertTriangle className="h-4 w-4" /> :
               <Clock className="h-4 w-4" />}
            </div>
          </div>
          
          {/* Content Card */}
          <div className={cn(
            "flex-1 card p-4 transition-all group-hover:-translate-y-0.5 group-hover:shadow-md",
            event.status === 'overdue' && "border-danger bg-danger/5",
            event.status === 'upcoming' && "border-primary bg-primary/5"
          )}>
            <div className="flex justify-between items-start">
              <div>
                <h4 className={cn("font-bold", event.status === 'completed' ? "text-foreground" : "text-primary")}>
                  {event.name}
                </h4>
                <p className="text-sm text-muted capitalize">{event.doseType} Dose</p>
              </div>
              <div className="text-right">
                <span className="text-sm font-semibold bg-surface-2 px-2.5 py-1 rounded-md border border-border">
                  {format(event.date, 'MMM d, yyyy')}
                </span>
                {event.status === 'overdue' && (
                  <p className="text-xs text-danger font-bold mt-1.5">
                    Overdue by {Math.abs(event.daysUntilDue!)} days
                  </p>
                )}
                {event.status === 'upcoming' && event.daysUntilDue! <= 30 && (
                  <p className="text-xs text-warning font-bold mt-1.5">
                    Due in {event.daysUntilDue} days
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
