import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePet } from '@/features/pets/hooks/usePets';
import { 
  useVaccinationSchedule, 
  useVaccinationAnalytics, 
  useVaccinationReactions, 
  useVaccinationCertificates,
  useVaccineDefinitions,
  useRecordVaccination,
  useRecordReaction
} from '../hooks/useVaccinations';
import { UpcomingVaccineCard } from '../components/UpcomingVaccineCard';
import { VaccinationTimeline } from '../components/VaccinationTimeline';
import { VaccineAnalyticsCharts } from '../components/VaccineAnalyticsCharts';
import { ReactionHistory } from '../components/ReactionHistory';
import { VaccineCertificateCard } from '../components/VaccineCertificateCard';
import { Shield, Plus, Activity, FileBadge, Calendar, X } from 'lucide-react';
import PageLoader from '@/shared/components/feedback/PageLoader';
import { toast } from 'sonner';

export function VaccinationDashboardPage() {
  const { petId } = useParams<{ petId: string }>();
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [showReactionModal, setShowReactionModal] = useState(false);
  const [selectedVaccineId, setSelectedVaccineId] = useState<string>('');

  const { data: pet, isLoading: isPetLoading } = usePet(petId!);
  const { data: schedule, isLoading: isScheduleLoading } = useVaccinationSchedule(petId!, pet?.species as string, pet?.dob);
  const { data: analytics, isLoading: isAnalyticsLoading } = useVaccinationAnalytics(petId!);
  const { data: reactions, isLoading: isReactionsLoading } = useVaccinationReactions(petId!);
  const { data: certificates, isLoading: isCertificatesLoading } = useVaccinationCertificates(petId!);
  const { data: vaccineDefs } = useVaccineDefinitions(pet?.species);

  const recordVaccineMutation = useRecordVaccination();
  const recordReactionMutation = useRecordReaction();

  // Record Vaccine Form State
  const [recordForm, setRecordForm] = useState({
    vaccineId: '',
    status: 'completed',
    doseNumber: 1,
    administeredDate: new Date().toISOString().split('T')[0],
    administeredBy: '',
    notes: '',
  });

  // Reaction Form State
  const [reactionForm, setReactionForm] = useState({
    severity: 'mild',
    symptoms: '',
    onsetDateTime: new Date().toISOString().slice(0, 16),
    vetNotes: '',
  });

  if (isPetLoading || isScheduleLoading || isAnalyticsLoading || isReactionsLoading || isCertificatesLoading) {
    return <PageLoader />;
  }

  if (!pet || !schedule) {
    return <div className="text-center p-8 text-danger">Failed to load vaccination data.</div>;
  }

  const handleRecordVaccineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const vaccineIdToUse = recordForm.vaccineId || selectedVaccineId || (vaccineDefs?.[0]?._id);
    if (!vaccineIdToUse) {
      toast.error('Please select a vaccine');
      return;
    }

    try {
      await recordVaccineMutation.mutateAsync({
        petId: petId!,
        data: {
          vaccineId: vaccineIdToUse,
          status: recordForm.status,
          currentDoseNumber: Number(recordForm.doseNumber),
          doses: [
            {
              doseNumber: Number(recordForm.doseNumber),
              doseType: 'primary',
              dueDate: recordForm.administeredDate,
              administeredDate: recordForm.administeredDate,
              status: recordForm.status,
              administeredBy: recordForm.administeredBy || 'Owner Log',
            },
          ],
          notes: recordForm.notes,
        },
      });
      setShowRecordModal(false);
      setSelectedVaccineId('');
    } catch {
      // Error handled by mutation toast
    }
  };

  const handleReactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await recordReactionMutation.mutateAsync({
        petId: petId!,
        data: {
          severity: reactionForm.severity,
          symptoms: reactionForm.symptoms.split(',').map((s) => s.trim()).filter(Boolean),
          onsetDateTime: reactionForm.onsetDateTime,
          vetNotes: reactionForm.vetNotes,
        },
      });
      setShowReactionModal(false);
    } catch {
      // Error handled by mutation toast
    }
  };

  const urgentVaccines = schedule.upcomingVaccines.filter((v) => v.isOverdue || v.daysUntilDue <= 30);

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-primary/10 via-indigo-500/10 to-transparent p-6 rounded-2xl border border-primary/20">
        <div className="flex items-center gap-4">
          <div className="bg-primary/20 p-3 rounded-2xl text-primary">
            <Shield className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Immunization Hub</h1>
            <p className="text-muted">Enterprise Vaccination Management for {pet.name}</p>
          </div>
        </div>
        <button
          onClick={() => {
            setSelectedVaccineId(vaccineDefs?.[0]?._id || '');
            setShowRecordModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-5 w-5" /> Record Vaccine
        </button>
      </div>

      {/* Analytics Overview */}
      {analytics && (
        <section>
          <VaccineAnalyticsCharts data={analytics} />
        </section>
      )}

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Left Column: Timeline & Schedule */}
        <div className="lg:col-span-2 space-y-8">
          {/* Urgent / Action Needed */}
          {urgentVaccines.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="h-5 w-5 text-warning" />
                <h2 className="text-lg font-bold text-foreground">Action Required</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {urgentVaccines.map((vaccine) => (
                  <UpcomingVaccineCard
                    key={`${vaccine.vaccineId}-${vaccine.dueDate}`}
                    vaccineName={vaccine.vaccineName}
                    doseType={vaccine.doseType}
                    dueDate={vaccine.dueDate}
                    isOverdue={vaccine.isOverdue}
                    daysUntilDue={vaccine.daysUntilDue}
                    onRecordAction={() => {
                      setSelectedVaccineId(vaccine.vaccineId);
                      setShowRecordModal(true);
                    }}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Full Timeline */}
          <section className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Lifetime Schedule</h2>
              </div>
              <span className="text-xs text-muted">Auto-calculated based on WSAVA guidelines</span>
            </div>
            
            <VaccinationTimeline schedule={schedule} />
          </section>
        </div>

        {/* Right Column: Certificates & Reactions */}
        <div className="space-y-8">
          {/* Digital Certificates */}
          <section className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <FileBadge className="h-5 w-5 text-indigo-500" />
                <h2 className="text-lg font-bold text-foreground">Digital Certificates</h2>
              </div>
              {certificates && certificates.length > 0 && (
                <span className="badge bg-indigo-500/10 text-indigo-500">{certificates.length}</span>
              )}
            </div>
            
            {!certificates || certificates.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-border rounded-xl">
                <FileBadge className="h-8 w-8 text-muted mx-auto mb-2 opacity-50" />
                <p className="text-sm text-muted">No certificates issued yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {certificates.map((cert) => (
                  <VaccineCertificateCard key={cert._id} certificate={cert} />
                ))}
              </div>
            )}
          </section>

          {/* Adverse Reactions */}
          <section className="card p-6 border-t-4 border-t-warning">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-warning" />
                <h2 className="text-lg font-bold text-foreground">Adverse Reactions</h2>
              </div>
              <button
                onClick={() => setShowReactionModal(true)}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Report
              </button>
            </div>
            
            <ReactionHistory reactions={reactions || []} />
          </section>
        </div>
      </div>

      {/* Record Vaccine Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-surface border border-border p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-foreground">Record Vaccination for {pet.name}</h3>
              <button onClick={() => setShowRecordModal(false)} className="text-muted hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordVaccineSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">Vaccine</label>
                <select
                  value={recordForm.vaccineId || selectedVaccineId}
                  onChange={(e) => setRecordForm({ ...recordForm, vaccineId: e.target.value })}
                  className="input w-full"
                >
                  <option value="">-- Select Vaccine --</option>
                  {vaccineDefs?.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.name} ({v.diseasePrevention?.join(', ') || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase mb-1">Status</label>
                  <select
                    value={recordForm.status}
                    onChange={(e) => setRecordForm({ ...recordForm, status: e.target.value })}
                    className="input w-full"
                  >
                    <option value="completed">Completed</option>
                    <option value="in_progress">In Progress</option>
                    <option value="upcoming">Upcoming</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted uppercase mb-1">Dose #</label>
                  <input
                    type="number"
                    min="1"
                    value={recordForm.doseNumber}
                    onChange={(e) => setRecordForm({ ...recordForm, doseNumber: Number(e.target.value) })}
                    className="input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">Date Administered</label>
                <input
                  type="date"
                  value={recordForm.administeredDate}
                  onChange={(e) => setRecordForm({ ...recordForm, administeredDate: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">Administered By / Vet Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Smith / City Vet Hospital"
                  value={recordForm.administeredBy}
                  onChange={(e) => setRecordForm({ ...recordForm, administeredBy: e.target.value })}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Serial # 12345, left shoulder"
                  value={recordForm.notes}
                  onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
                  className="input w-full"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRecordModal(false)}
                  className="px-4 py-2 text-sm font-medium text-muted hover:bg-surface-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recordVaccineMutation.isPending}
                  className="px-5 py-2 text-sm font-semibold bg-primary text-white rounded-xl hover:opacity-90 disabled:opacity-60"
                >
                  {recordVaccineMutation.isPending ? 'Saving...' : 'Record Vaccination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Reaction Modal */}
      {showReactionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-surface border border-border p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-foreground">Report Adverse Reaction</h3>
              <button onClick={() => setShowReactionModal(false)} className="text-muted hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReactionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">Severity</label>
                <select
                  value={reactionForm.severity}
                  onChange={(e) => setReactionForm({ ...reactionForm, severity: e.target.value })}
                  className="input w-full"
                >
                  <option value="mild">Mild (lethargy, mild swelling)</option>
                  <option value="moderate">Moderate (fever, vomiting)</option>
                  <option value="severe">Severe (hives, difficulty breathing)</option>
                  <option value="emergency">Emergency (anaphylaxis)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">Symptoms (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Swelling, lethargy, loss of appetite"
                  value={reactionForm.symptoms}
                  onChange={(e) => setReactionForm({ ...reactionForm, symptoms: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">Onset Date & Time</label>
                <input
                  type="datetime-local"
                  value={reactionForm.onsetDateTime}
                  onChange={(e) => setReactionForm({ ...reactionForm, onsetDateTime: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">Vet Notes / Observations</label>
                <textarea
                  rows={3}
                  placeholder="Describe the reaction in detail..."
                  value={reactionForm.vetNotes}
                  onChange={(e) => setReactionForm({ ...reactionForm, vetNotes: e.target.value })}
                  className="input w-full"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReactionModal(false)}
                  className="px-4 py-2 text-sm font-medium text-muted hover:bg-surface-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recordReactionMutation.isPending}
                  className="px-5 py-2 text-sm font-semibold bg-danger text-white rounded-xl hover:opacity-90 disabled:opacity-60"
                >
                  {recordReactionMutation.isPending ? 'Submitting...' : 'Submit Reaction Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function AlertCircle(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
}
