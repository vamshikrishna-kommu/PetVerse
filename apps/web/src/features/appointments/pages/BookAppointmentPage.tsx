import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePets } from '@/features/pets/hooks/usePets';
import { useAvailableSlots, useBookAppointment } from '../hooks/useAppointments';
import { useClinic } from '@/features/nearby/hooks/useNearby';
import { ArrowLeft, Calendar, Clock, Stethoscope, MapPin, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function BookAppointmentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedClinicId = searchParams.get('clinicId') || undefined;

  const { data: petsRes, isLoading: isLoadingPets } = usePets();
  const { data: preselectedClinic } = useClinic(preselectedClinicId || '');

  const [petId, setPetId] = useState<string>('');
  const [appointmentDate, setAppointmentDate] = useState<string>(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState<string>('');
  const [type, setType] = useState<string>('checkup');
  const [notes, setNotes] = useState<string>('');

  const { data: slots, isLoading: isLoadingSlots } = useAvailableSlots(
    preselectedClinicId,
    appointmentDate
  );
  const bookAppointment = useBookAppointment();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!petId) {
      toast.error('Please select a pet');
      return;
    }
    if (!startTime) {
      toast.error('Please select an available time slot');
      return;
    }

    bookAppointment.mutate(
      {
        petId,
        clinicId: preselectedClinicId,
        appointmentDate,
        startTime,
        type,
        notes,
      },
      {
        onSuccess: () => {
          toast.success('Appointment booked successfully!');
          navigate('/appointments');
        },
        onError: (err: any) => {
          if (err.response?.status === 409) {
            toast.error('This appointment slot is no longer available.');
          } else {
            toast.error(err.response?.data?.error?.message || 'Failed to book appointment');
          }
        },
      }
    );
  };

  return (
    <div className="container-page py-8 max-w-3xl">
      <button
        onClick={() => navigate('/appointments')}
        className="flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Appointments
      </button>

      <div className="card p-6 sm:p-8 bg-surface border-border shadow-xl rounded-2xl">
        <h1 className="text-2xl font-bold text-foreground mb-2">Book Veterinary Appointment</h1>
        <p className="text-sm text-muted mb-6">
          Schedule a checkup or consultation with real-time slot availability.
        </p>

        {preselectedClinic && (
          <div className="card bg-surface-2 p-4 mb-6 border border-primary/30 flex items-center gap-3">
            <MapPin className="h-5 w-5 text-primary shrink-0" />
            <div>
              <p className="font-semibold text-foreground">{preselectedClinic.name}</p>
              <p className="text-xs text-muted">{preselectedClinic.address}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 1. Select Pet */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
              Select Pet *
            </label>
            {isLoadingPets ? (
              <p className="text-sm text-muted">Loading your pets...</p>
            ) : !petsRes?.data || petsRes.data.length === 0 ? (
              <p className="text-sm text-danger">Please add a pet before booking an appointment.</p>
            ) : (
              <select
                value={petId}
                onChange={(e) => setPetId(e.target.value)}
                className="input w-full"
                required
              >
                <option value="">-- Choose Pet --</option>
                {petsRes.data.map((p: any) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.species})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 2. Select Appointment Type */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
              Appointment Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="input w-full"
            >
              <option value="checkup">Routine Checkup</option>
              <option value="vaccination">Vaccination</option>
              <option value="surgery">Surgery</option>
              <option value="grooming">Grooming</option>
              <option value="consultation">Consultation</option>
            </select>
          </div>

          {/* 3. Select Date */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
              Appointment Date *
            </label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={appointmentDate}
              onChange={(e) => {
                setAppointmentDate(e.target.value);
                setStartTime('');
              }}
              className="input w-full"
              required
            />
          </div>

          {/* 4. Select Available Slot */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
              Available Time Slots *
            </label>
            {isLoadingSlots ? (
              <p className="text-sm text-muted">Checking slot availability...</p>
            ) : !slots || slots.length === 0 ? (
              <p className="text-sm text-warning flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> No available slots for this date.
              </p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setStartTime(slot)}
                    className={`py-2.5 px-3 rounded-xl border text-sm font-semibold transition-all ${
                      startTime === slot
                        ? 'bg-primary text-white border-primary shadow-md'
                        : 'bg-surface-2 text-foreground border-border hover:border-primary/50'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 5. Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
              Reason / Additional Notes
            </label>
            <textarea
              rows={3}
              placeholder="Describe any symptoms, reason for visit, or special requests..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input w-full"
            />
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-border flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/appointments')}
              className="px-6 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-surface-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={bookAppointment.isPending || !startTime || !petId}
              className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 shadow-md"
            >
              {bookAppointment.isPending ? 'Confirming...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}