import { format } from 'date-fns';
import { 
  CheckCircle2, 
  Syringe, 
  Stethoscope, 
  Pill, 
  Scale, 
  Cake, 
  Heart, 
  AlertTriangle, 
  Search, 
  Calendar, 
  FileText, 
  QrCode,
  Clock
} from 'lucide-react';
import type { IPetTimelineEvent, TimelineEventType } from '@petverse/shared-types';
import { cn } from '@/shared/utils/cn';

interface TimelineProps {
  events: IPetTimelineEvent[];
}

const getEventIcon = (type: TimelineEventType) => {
  switch (type) {
    case 'created': return <CheckCircle2 className="h-5 w-5 text-primary" />;
    case 'vaccinated': return <Syringe className="h-5 w-5 text-success" />;
    case 'doctor_visit': return <Stethoscope className="h-5 w-5 text-info" />;
    case 'medicine_started': return <Pill className="h-5 w-5 text-warning" />;
    case 'weight_updated': return <Scale className="h-5 w-5 text-secondary" />;
    case 'birthday': return <Cake className="h-5 w-5 text-accent" />;
    case 'adopted': return <Heart className="h-5 w-5 text-danger" />;
    case 'lost': return <AlertTriangle className="h-5 w-5 text-danger" />;
    case 'found': return <Search className="h-5 w-5 text-success" />;
    case 'appointment': return <Calendar className="h-5 w-5 text-primary" />;
    case 'medical_report_added': return <FileText className="h-5 w-5 text-info" />;
    case 'qr_generated': return <QrCode className="h-5 w-5 text-foreground" />;
    default: return <Clock className="h-5 w-5 text-muted" />;
  }
};

const getEventColor = (type: TimelineEventType) => {
  switch (type) {
    case 'created': return 'bg-primary/10 border-primary/20';
    case 'vaccinated': return 'bg-success/10 border-success/20';
    case 'doctor_visit': return 'bg-info/10 border-info/20';
    case 'medicine_started': return 'bg-warning/10 border-warning/20';
    case 'weight_updated': return 'bg-secondary/10 border-secondary/20';
    case 'birthday': return 'bg-accent/10 border-accent/20';
    case 'adopted': return 'bg-danger/10 border-danger/20';
    case 'lost': return 'bg-danger/10 border-danger/20';
    case 'found': return 'bg-success/10 border-success/20';
    case 'appointment': return 'bg-primary/10 border-primary/20';
    case 'medical_report_added': return 'bg-info/10 border-info/20';
    case 'qr_generated': return 'bg-surface-3 border-border';
    default: return 'bg-surface-2 border-border';
  }
};

export function Timeline({ events }: TimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 opacity-50">
        <Clock className="h-10 w-10 text-muted mb-4" />
        <p className="text-sm font-medium text-foreground">No events recorded yet.</p>
        <p className="text-xs mt-1 text-muted">The timeline will populate as you track activities.</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
      {events.map((event, index) => (
        <div key={event._id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          {/* Timeline Icon */}
          <div className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full border-2 bg-background shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 transition-transform group-hover:scale-110",
            getEventColor(event.type)
          )}>
            {getEventIcon(event.type)}
          </div>
          
          {/* Timeline Content */}
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border bg-surface shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1 gap-2">
              <h4 className="font-bold text-foreground">{event.title}</h4>
              <time className="text-xs font-medium text-muted flex items-center gap-1 shrink-0">
                <Clock className="h-3 w-3" />
                {format(new Date(event.date), 'MMM d, yyyy h:mm a')}
              </time>
            </div>
            {event.description && (
              <p className="text-sm text-muted-fg mt-2 leading-relaxed">
                {event.description}
              </p>
            )}
            {event.metadata && (
              <div className="mt-3 p-3 rounded-lg bg-surface-2 text-xs font-mono text-muted-fg break-all">
                {JSON.stringify(event.metadata)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
