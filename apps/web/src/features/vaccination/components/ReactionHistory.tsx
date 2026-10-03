import React from 'react';
import { Activity, AlertTriangle, Syringe, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/shared/utils/cn';
import type { IVaccinationReaction } from '@petverse/shared-types';

interface ReactionHistoryProps {
  reactions: IVaccinationReaction[];
  className?: string;
}

export function ReactionHistory({ reactions, className }: ReactionHistoryProps) {
  if (!reactions || reactions.length === 0) {
    return (
      <div className={cn("text-center py-8 opacity-60", className)}>
        <Activity className="h-12 w-12 text-muted mx-auto mb-3" />
        <p className="font-medium text-sm">No adverse reactions reported.</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {reactions.map((reaction) => (
        <div key={reaction._id} className="card p-4 border-l-2 border-l-warning bg-warning/5">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className={cn(
                "h-5 w-5",
                reaction.severity === 'emergency' ? "text-danger" : "text-warning"
              )} />
              <h4 className="font-bold text-foreground capitalize">
                {reaction.severity} Reaction
              </h4>
            </div>
            <span className="text-xs text-muted font-medium bg-surface px-2 py-1 rounded-md border border-border">
              {format(new Date(reaction.onsetDateTime), 'MMM d, yyyy h:mm a')}
            </span>
          </div>
          
          <div className="pl-7 space-y-3">
            <div>
              <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-1">Symptoms</p>
              <div className="flex flex-wrap gap-1.5">
                {reaction.symptoms.map(s => (
                  <span key={s} className="text-xs bg-surface-2 text-foreground px-2 py-0.5 rounded-full border border-border">
                    {s}
                  </span>
                ))}
              </div>
            </div>
            
            {reaction.vetEvaluated && (
              <div className="bg-surface rounded-lg p-3 border border-border flex items-start gap-2">
                <FileText className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-foreground">Vet Evaluation</p>
                  <p className="text-xs text-muted mt-1 leading-relaxed">{reaction.vetNotes || 'Evaluated without notes.'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
