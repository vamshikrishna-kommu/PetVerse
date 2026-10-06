import React, { useState } from 'react';
import { Calendar, Clock, AlertCircle, X, Check } from 'lucide-react';
import { useAvailableSlots, useRescheduleAppointment } from '../hooks/useAppointments';
import { toast } from 'sonner';
import { cn } from '@/shared/utils/cn';
import type { IAppointment } from '@petverse/shared-types';

interface RescheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: IAppointment;
}

export function RescheduleModal({ isOpen, onClose, appointment }: RescheduleModalProps) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const [newDate, setNewDate] = useState(minDate);
  const [selectedSlot, setSelectedSlot] = useState('');

  const { data: slots, isLoading: loadingSlots } = useAvailableSlots(
    appointment.clinicId,
    newDate
  );

  const rescheduleMutation = useRescheduleAppointment();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || !selectedSlot) {
      toast.error('Please select a date and an available time slot.');
      return;
    }

    rescheduleMutation.mutate(
      {
        id: appointment._id,
        data: {
          appointmentDate: newDate,
          startTime: selectedSlot,
        },
      },
      {
        onSuccess: () => {
          toast.success('Appointment rescheduled successfully!');
          onClose();
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.error?.message || 'Failed to reschedule appointment');
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl p-6 relative max-h-[calc(100dvh-2rem)] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-foreground">Reschedule Appointment</h2>
            <p className="text-xs text-muted mt-0.5">
              Current: {appointment.appointmentDate} at {appointment.startTime}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-muted/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 mt-5">
          {/* New Date Field */}
          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
              Select New Date
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="date"
                min={minDate}
                value={newDate}
                onChange={(e) => {
                  setNewDate(e.target.value);
                  setSelectedSlot('');
                }}
                className="w-full bg-background border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                required
              />
            </div>
          </div>

          {/* Slot Selection */}
          <div>
            <label className="block text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
              Select New Time Slot
            </label>

            {loadingSlots ? (
              <div className="flex items-center justify-center p-6 text-sm text-muted">
                <Clock className="w-4 h-4 animate-spin mr-2" /> Loading available slots...
              </div>
            ) : !slots || slots.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                No time slots available for {newDate}. Please choose another date.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setSelectedSlot(slot)}
                    className={cn(
                      'px-3 py-2 rounded-xl text-xs font-medium border text-center transition-all',
                      selectedSlot === slot
                        ? 'bg-primary text-white border-primary shadow-sm font-semibold'
                        : 'bg-background border-border text-foreground hover:border-primary/50'
                    )}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-muted hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedSlot || rescheduleMutation.isPending}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-sm"
            >
              {rescheduleMutation.isPending ? (
                'Rescheduling...'
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" /> Confirm Reschedule
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
