import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePrescriptions, useMedicationCourses, useCreatePrescription } from '../hooks/useMedication';
import { Pill, CheckCircle, Calendar, Plus, X, Stethoscope, Clock } from 'lucide-react';
import { AdministrationLogger } from '../components/AdministrationLogger';
import { toast } from 'sonner';

export default function MedicationDashboardPage() {
  const { petId } = useParams<{ petId: string }>();
  const [loggerOpen, setLoggerOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [showRxModal, setShowRxModal] = useState(false);

  const { data: prescriptions, isLoading: isLoadingRx } = usePrescriptions(petId!);
  const { data: courses, isLoading: isLoadingCourses } = useMedicationCourses(petId!);
  const createRxMutation = useCreatePrescription(petId!);

  // Form state
  const [form, setForm] = useState({
    vetName: '',
    clinicName: '',
    diagnosis: '',
    medicationName: '',
    dosage: '',
    instructions: '',
    durationDays: 14,
    schedule: {
      morning: true,
      afternoon: false,
      evening: true,
      night: false,
    },
  });

  const handleLogClick = (courseId: string) => {
    setSelectedCourse(courseId);
    setLoggerOpen(true);
  };

  const handleCreateRx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.medicationName.trim()) {
      toast.error('Please enter a medication name');
      return;
    }

    try {
      await createRxMutation.mutateAsync({
        vetName: form.vetName || 'Prescribing Vet',
        clinicName: form.clinicName || 'Veterinary Clinic',
        diagnosis: form.diagnosis || 'General Treatment',
        instructions: form.instructions || `Take ${form.dosage || '1 dose'} daily for ${form.durationDays} days.`,
        items: [
          {
            medicationName: form.medicationName,
            dosage: form.dosage || '1 tablet',
            route: 'oral',
            durationDays: Number(form.durationDays),
            instructions: form.instructions,
            schedule: form.schedule,
          },
        ],
      });
      toast.success('Prescription created successfully!');
      setShowRxModal(false);
      setForm({
        vetName: '',
        clinicName: '',
        diagnosis: '',
        medicationName: '',
        dosage: '',
        instructions: '',
        durationDays: 14,
        schedule: { morning: true, afternoon: false, evening: true, night: false },
      });
    } catch {
      toast.error('Failed to create prescription');
    }
  };

  if (isLoadingRx || isLoadingCourses) {
    return <div className="p-8 text-center text-muted">Loading medication platform...</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Pill className="w-7 h-7 text-indigo-500" /> Medications & Prescriptions
          </h1>
          <p className="text-muted text-sm mt-1">Manage active courses, log administrations, and record prescriptions.</p>
        </div>
        <button
          onClick={() => setShowRxModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-semibold rounded-xl hover:opacity-90 shadow-md shadow-primary/30 transition"
        >
          <Plus className="w-4 h-4" /> New Prescription
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Active Courses */}
        <div className="card p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
            <Calendar className="w-5 h-5 text-indigo-500" /> Active Medication Courses
          </h2>
          
          <div className="space-y-4">
            {!courses || courses.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-border rounded-xl text-muted text-sm">
                No active medication courses right now.
              </div>
            ) : (
              courses.map((course: any) => (
                <div key={course._id} className="p-4 border border-border bg-surface-2/40 rounded-xl flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {course.medicationName || `Medication Course`}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-muted mt-1">
                      <span className="capitalize badge bg-indigo-500/10 text-indigo-500">{course.status}</span>
                      <span>• Doses completed: {course.dosesCompleted || 0} / {course.totalDosesExpected || 'N/A'}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleLogClick(course._id)}
                    className="px-3.5 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:opacity-90 shadow-sm transition"
                  >
                    Log Dose
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Prescriptions */}
        <div className="card p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
            <Stethoscope className="w-5 h-5 text-emerald-500" /> Prescriptions History
          </h2>
          
          <div className="space-y-4">
            {!prescriptions || prescriptions.length === 0 ? (
              <div className="p-6 text-center border-2 border-dashed border-border rounded-xl text-muted text-sm">
                No active prescriptions recorded.
              </div>
            ) : (
              prescriptions.map((rx: any) => (
                <div key={rx._id} className="p-4 border border-emerald-500/20 bg-emerald-500/5 rounded-xl">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-foreground">{rx.diagnosis || 'Prescription'}</h3>
                      <p className="text-xs text-muted mt-0.5">Vet: {rx.vetName || 'N/A'} • {rx.clinicName || 'Clinic'}</p>
                    </div>
                    <span className="text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-lg capitalize">
                      {rx.status}
                    </span>
                  </div>
                  {rx.instructions && (
                    <p className="text-xs text-muted mt-2 italic">"{rx.instructions}"</p>
                  )}
                  <p className="text-[11px] text-muted mt-2">
                    Issued: {new Date(rx.issuedAt || rx.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Log Dose Modal */}
      {loggerOpen && selectedCourse && (
        <AdministrationLogger 
          petId={petId!} 
          courseId={selectedCourse}
          onClose={() => setLoggerOpen(false)} 
        />
      )}

      {/* New Prescription Modal */}
      {showRxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-surface border border-border p-6 shadow-xl space-y-4 max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-foreground">Issue New Prescription</h3>
              <button onClick={() => setShowRxModal(false)} className="text-muted hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRx} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">Medication Name</label>
                <input
                  type="text"
                  placeholder="e.g. Amoxicillin 250mg"
                  value={form.medicationName}
                  onChange={(e) => setForm({ ...form, medicationName: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase mb-1">Dosage</label>
                  <input
                    type="text"
                    placeholder="e.g. 1 tablet (250mg)"
                    value={form.dosage}
                    onChange={(e) => setForm({ ...form, dosage: e.target.value })}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted uppercase mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    value={form.durationDays}
                    onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })}
                    className="input w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase mb-1">Prescribing Vet</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Sarah Jenkins"
                    value={form.vetName}
                    onChange={(e) => setForm({ ...form, vetName: e.target.value })}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted uppercase mb-1">Clinic Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Metro Vet Hospital"
                    value={form.clinicName}
                    onChange={(e) => setForm({ ...form, clinicName: e.target.value })}
                    className="input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">Diagnosis / Condition</label>
                <input
                  type="text"
                  placeholder="e.g. Upper Respiratory Infection"
                  value={form.diagnosis}
                  onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">Dose Schedule</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { key: 'morning', label: 'Morning' },
                    { key: 'afternoon', label: 'Afternoon' },
                    { key: 'evening', label: 'Evening' },
                    { key: 'night', label: 'Night' },
                  ].map((s) => (
                    <label key={s.key} className="flex items-center gap-1.5 border border-border p-2 rounded-xl text-xs cursor-pointer hover:bg-surface-2">
                      <input
                        type="checkbox"
                        checked={(form.schedule as any)[s.key]}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            schedule: { ...form.schedule, [s.key]: e.target.checked },
                          })
                        }
                        className="rounded"
                      />
                      <span>{s.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">Instructions / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Take with meals twice daily"
                  value={form.instructions}
                  onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                  className="input w-full"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRxModal(false)}
                  className="px-4 py-2 text-sm font-medium text-muted hover:bg-surface-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createRxMutation.isPending}
                  className="px-5 py-2 text-sm font-semibold bg-primary text-white rounded-xl hover:opacity-90 disabled:opacity-60"
                >
                  {createRxMutation.isPending ? 'Issuing...' : 'Issue Prescription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
