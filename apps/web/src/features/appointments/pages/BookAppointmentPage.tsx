import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePets } from '@/features/pets/hooks/usePets';
import { useAvailableSlots, useBookAppointment } from '../hooks/useAppointments';
import { useClinic, useNearbyServices } from '@/features/nearby/hooks/useNearby';
import { ArrowLeft, Stethoscope, MapPin, AlertTriangle, Building2, X } from 'lucide-react';
import { toast } from 'sonner';

export default function BookAppointmentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClinicId = searchParams.get('clinicId') || '';

  const [selectedClinicId, setSelectedClinicId] = useState<string>(queryClinicId);
  const [showClinicSelector, setShowClinicSelector] = useState<boolean>(!queryClinicId);

  // Sync if query param changes
  useEffect(() => {
    if (queryClinicId) {
      setSelectedClinicId(queryClinicId);
      setShowClinicSelector(false);
    }
  }, [queryClinicId]);

  const { data: petsRes, isLoading: isLoadingPets } = usePets();
  const { data: clinicDetails } = useClinic(selectedClinicId);
  const { data: nearbyClinics } = useNearbyServices({ limit: 50 });

  const [petId, setPetId] = useState<string>('');
  const [appointmentDate, setAppointmentDate] = useState<string>(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState<string>('');
  const [type, setType] = useState<string>('checkup');
  const [notes, setNotes] = useState<string>('');

  const { data: slots, isLoading: isLoadingSlots } = useAvailableSlots(
    selectedClinicId || undefined,
    appointmentDate
  );
  const bookAppointment = useBookAppointment();

  // Selected clinic object (from details or directory list)
  const activeClinic =
    clinicDetails ||
    nearbyClinics?.find((c) => c._id === selectedClinicId);

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
        clinicId: selectedClinicId || undefined,
        clinicName: activeClinic?.name,
        clinicAddress: activeClinic?.address,
        appointmentDate,
        startTime,
        type,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Appointment booked successfully!');
          navigate('/appointments');
        },
        onError: (err: any) => {
          const detailMsg = err.response?.data?.error?.details?.[0]?.message;
          const apiMsg = err.response?.data?.error?.message || err.response?.data?.message;
          if (err.response?.status === 409) {
            toast.error('This appointment slot is no longer available.');
          } else {
            toast.error(detailMsg || apiMsg || 'Failed to book appointment');
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

      <div className="card p-5 sm:p-8 bg-surface border-border shadow-xl rounded-2xl">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Book Veterinary Appointment</h1>
            <p className="text-sm text-muted mt-1">
              Schedule a veterinary visit, checkup, or vaccination with real-time slot availability.
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Stethoscope className="h-5 w-5" />
          </div>
        </div>

        {/* Clinic Info or Selector Card */}
        {activeClinic && !showClinicSelector ? (
          <div className="card bg-surface-2 p-4 my-6 border border-primary/30 flex items-start sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className="h-9 w-9 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground truncate">{activeClinic.name}</p>
                <p className="text-xs text-muted truncate">{activeClinic.address}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowClinicSelector(true)}
              className="text-xs font-semibold text-primary hover:underline shrink-0 ml-2"
            >
              Change Clinic
            </button>
          </div>
        ) : (
          <div className="my-6 p-4 rounded-xl bg-surface-2 border border-border">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-primary" /> Select Clinic / Hospital (Optional)
              </label>
              {selectedClinicId && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClinicId('');
                    setStartTime('');
                  }}
                  className="text-xs text-danger hover:underline flex items-center gap-1"
                >
                  <X className="h-3 w-3" /> Clear Clinic
                </button>
              )}
            </div>
            <select
              value={selectedClinicId}
              onChange={(e) => {
                setSelectedClinicId(e.target.value);
                setStartTime('');
                if (e.target.value) {
                  setShowClinicSelector(false);
                }
              }}
              className="input w-full bg-surface"
            >
              <option value="">-- General Practice / Pet Consultation (Any Clinic) --</option>
              {nearbyClinics &&
                nearbyClinics.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} {c.locality ? `— ${c.locality}` : ''}
                  </option>
                ))}
            </select>
            <p className="text-xs text-muted mt-1.5">
              Choose from verified Hyderabad veterinary clinics or book a general veterinary consultation.
            </p>
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
              <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 text-sm text-danger flex items-center justify-between">
                <span>Please add a pet before booking an appointment.</span>
                <button
                  type="button"
                  onClick={() => navigate('/pets/add')}
                  className="font-semibold underline ml-2"
                >
                  Add Pet
                </button>
              </div>
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
              <option value="consultation">Consultation</option>
              <option value="grooming">Grooming & Hygiene</option>
              <option value="surgery">Specialist / Surgery Consultation</option>
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
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>No available slots for this date. Please choose a different date.</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
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
              Reason / Additional Notes (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Describe symptoms, reason for visit, or special requests..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input w-full"
            />
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-border flex justify-end gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => navigate('/appointments')}
              className="px-5 sm:px-6 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-surface-2 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={bookAppointment.isPending || !startTime || !petId}
              className="px-5 sm:px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 shadow-md transition-all flex items-center gap-2"
            >
              {bookAppointment.isPending ? 'Confirming...' : 'Confirm Booking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}