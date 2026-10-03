import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppointments, useCancelAppointment, useCompleteAppointment } from '../hooks/useAppointments';
import {
  Calendar as CalendarIcon,
  Plus,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Stethoscope,
  ChevronRight,
  Filter,
  CreditCard,
} from 'lucide-react';
import { Skeleton } from '@/shared/components/feedback/Skeleton';
import { toast } from 'sonner';
import { cn, formatCurrency } from '@/shared/utils/cn';
import { PaymentModal } from '@/features/payments/components/PaymentModal';
import { RescheduleModal } from '../components/RescheduleModal';
import type { IAppointment } from '@petverse/shared-types';

export default function AppointmentsPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'completed' | 'cancelled'>(
    'upcoming'
  );
  const [selectedPaymentAppt, setSelectedPaymentAppt] = useState<IAppointment | null>(null);
  const [selectedRescheduleAppt, setSelectedRescheduleAppt] = useState<IAppointment | null>(null);

  const { data: appointments, isLoading } = useAppointments(
    statusFilter === 'all' ? undefined : statusFilter
  );
  const cancelAppointment = useCancelAppointment();
  const completeAppointment = useCompleteAppointment();

  const handleCancel = (id: string) => {
    const reason = window.prompt('Reason for cancellation (optional):');
    if (reason !== null) {
      cancelAppointment.mutate(
        { id, reason: reason || 'Cancelled by user' },
        {
          onSuccess: () => toast.success('Appointment cancelled successfully'),
          onError: () => toast.error('Failed to cancel appointment'),
        }
      );
    }
  };

  const handleComplete = (id: string) => {
    if (window.confirm('Mark this appointment as completed?')) {
      completeAppointment.mutate(id, {
        onSuccess: () => toast.success('Appointment marked as completed'),
        onError: () => toast.error('Failed to complete appointment'),
      });
    }
  };

  return (
    <div className="container-page py-8">
      {/* Top Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Veterinary Appointments</h1>
          <p className="text-sm text-muted mt-1">Manage scheduled clinic visits and checkups</p>
        </div>
        <Link
          to="/appointments/book"
          className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-primary/90 transition-all w-fit"
        >
          <Plus className="h-4 w-4" /> Book Appointment
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-border mb-6 overflow-x-auto no-scrollbar">
        {(['upcoming', 'all', 'completed', 'cancelled'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={cn(
              'px-5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors capitalize',
              statusFilter === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-foreground'
            )}
          >
            {tab} Appointments
          </button>
        ))}
      </div>

      {/* Content List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
      ) : !appointments || appointments.length === 0 ? (
        <div className="card p-12 text-center flex flex-col items-center justify-center">
          <CalendarIcon className="h-16 w-16 text-muted mb-4 opacity-40" />
          <h3 className="text-lg font-bold text-foreground">No appointments found</h3>
          <p className="text-sm text-muted mt-1 mb-6">
            You don't have any {statusFilter !== 'all' ? statusFilter : ''} appointments scheduled.
          </p>
          <Link
            to="/appointments/book"
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary/90"
          >
            Book New Appointment
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => (
            <div
              key={appt._id}
              className="card p-6 border-border hover:border-primary/40 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div
                  className={cn(
                    'h-12 w-12 rounded-xl flex items-center justify-center shrink-0',
                    (appt.status as string) === 'scheduled' || (appt.status as string) === 'confirmed'
                      ? 'bg-primary/10 text-primary'
                      : (appt.status as string) === 'completed'
                      ? 'bg-success/10 text-success'
                      : 'bg-danger/10 text-danger'
                  )}
                >
                  <Stethoscope className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-foreground capitalize">
                      {appt.type} Appointment
                    </h3>
                    <span
                      className={cn(
                        'badge capitalize',
                        (appt.status as string) === 'scheduled' || (appt.status as string) === 'confirmed'
                          ? 'bg-primary/10 text-primary border-primary/20'
                          : (appt.status as string) === 'completed'
                          ? 'bg-success/10 text-success border-success/20'
                          : 'bg-danger/10 text-danger border-danger/20'
                      )}
                    >
                      {appt.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted mt-2">
                    <span className="flex items-center gap-1.5">
                      <CalendarIcon className="h-4 w-4 text-muted" /> {appt.appointmentDate || appt.scheduledAt?.split('T')[0]}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-muted" /> {appt.startTime || 'Scheduled'}
                    </span>
                    {typeof appt.fee === 'number' && appt.fee > 0 && (
                      <span className="flex items-center gap-1 font-semibold text-foreground">
                        <CreditCard className="h-3.5 w-3.5 text-primary" /> {formatCurrency(appt.fee)}
                        <span
                          className={cn(
                            'ml-1 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase',
                            appt.paymentStatus === 'paid'
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : 'bg-amber-500/10 text-amber-600'
                          )}
                        >
                          {appt.paymentStatus || 'unpaid'}
                        </span>
                      </span>
                    )}
                  </div>

                  {appt.notes && (
                    <p className="text-xs text-muted mt-2 italic">"{appt.notes}"</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 self-end md:self-center">
                {typeof appt.fee === 'number' &&
                  appt.fee > 0 &&
                  appt.paymentStatus !== 'paid' &&
                  (appt.status as string) !== 'cancelled' && (
                    <button
                      onClick={() => setSelectedPaymentAppt(appt)}
                      className="px-3.5 py-2 text-xs font-semibold text-white bg-primary rounded-xl hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <CreditCard className="w-3.5 h-3.5" /> Pay Fee
                    </button>
                  )}

                {((appt.status as string) === 'scheduled' || (appt.status as string) === 'confirmed') && (
                  <>
                    <button
                      onClick={() => setSelectedRescheduleAppt(appt)}
                      className="px-3.5 py-2 text-xs font-semibold text-primary border border-primary/20 bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors flex items-center gap-1"
                    >
                      <Clock className="w-3.5 h-3.5" /> Reschedule
                    </button>
                    <button
                      onClick={() => handleComplete(appt._id)}
                      className="px-3.5 py-2 text-xs font-semibold text-emerald-600 border border-emerald-500/20 bg-emerald-500/10 rounded-xl hover:bg-emerald-500/20 transition-colors flex items-center gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Complete
                    </button>
                    <button
                      onClick={() => handleCancel(appt._id)}
                      className="px-3.5 py-2 text-xs font-semibold text-danger border border-danger/20 rounded-xl hover:bg-danger/10 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPaymentAppt && (
        <PaymentModal
          isOpen={!!selectedPaymentAppt}
          onClose={() => setSelectedPaymentAppt(null)}
          appointmentId={selectedPaymentAppt._id}
          appointmentType={selectedPaymentAppt.type}
          amount={selectedPaymentAppt.fee || 0}
          date={selectedPaymentAppt.appointmentDate || selectedPaymentAppt.scheduledAt?.split('T')[0]}
        />
      )}

      {selectedRescheduleAppt && (
        <RescheduleModal
          isOpen={!!selectedRescheduleAppt}
          onClose={() => setSelectedRescheduleAppt(null)}
          appointment={selectedRescheduleAppt}
        />
      )}
    </div>
  );
}