import React, { useState } from 'react';
import { useMyReminders, useCompleteReminder, useSnoozeReminder, useCreateReminder } from '../hooks/useReminders';
import { usePets } from '@/features/pets/hooks/usePets';
import {
  BellRing,
  CheckCircle2,
  Clock,
  Info,
  Calendar,
  Plus,
  X,
  AlertTriangle,
  Repeat,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Moon,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { IReminder, ReminderFrequency, PriorityLevel } from '@petverse/shared-types';

dayjs.extend(relativeTime);

const CRON_PRESETS = [
  { label: 'Daily at 8:00 AM', expr: '0 8 * * *', desc: 'Runs once every day at 8:00 AM' },
  { label: 'Twice Daily (8am & 8pm)', expr: '0 8,20 * * *', desc: 'Runs daily at 8:00 AM and 8:00 PM' },
  { label: 'Weekdays Only (Mon-Fri 9am)', expr: '0 9 * * 1-5', desc: 'Runs Monday through Friday at 9:00 AM' },
  { label: 'Every Sunday at 10:00 AM', expr: '0 10 * * 0', desc: 'Weekly on Sundays at 10:00 AM' },
  { label: 'Every 2 Days at 9:00 AM', expr: '0 9 */2 * *', desc: 'Runs every other day at 9:00 AM' },
];

export default function RemindersPage() {
  const [showModal, setShowModal] = useState(false);
  const [snoozeModalTarget, setSnoozeModalTarget] = useState<IReminder | null>(null);
  const [snoozeHours, setSnoozeHours] = useState<number>(1);
  const [showEscalation, setShowEscalation] = useState(false);

  const { data: reminders, isLoading } = useMyReminders();
  const { data: petsResponse } = usePets();
  const completeMutation = useCompleteReminder();
  const snoozeMutation = useSnoozeReminder();
  const createMutation = useCreateReminder();

  const pets = petsResponse?.data || [];

  // Form state
  const [form, setForm] = useState({
    petId: '',
    title: '',
    message: '',
    type: 'medication',
    frequency: 'daily' as ReminderFrequency,
    cronExpression: '0 8 * * *',
    priority: 'medium' as PriorityLevel,
    nextTrigger: dayjs().add(1, 'hour').format('YYYY-MM-THH:mm'),
    escalation: {
      maxRetries: 1,
      retryIntervalMinutes: 60,
      notifySecondaryOwner: false,
      emergencyEscalation: false,
    },
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.petId) {
      toast.error('Please select a pet');
      return;
    }
    if (!form.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    try {
      await createMutation.mutateAsync({
        petId: form.petId,
        title: form.title,
        message: form.message,
        type: form.type as any,
        frequency: form.frequency,
        cronExpression: form.frequency === 'custom' ? form.cronExpression : undefined,
        priority: form.priority,
        nextTrigger: new Date(form.nextTrigger).toISOString(),
        escalation: form.escalation,
      });
      toast.success('Reminder created successfully!');
      setShowModal(false);
      setForm({
        petId: '',
        title: '',
        message: '',
        type: 'medication',
        frequency: 'daily',
        cronExpression: '0 8 * * *',
        priority: 'medium',
        nextTrigger: dayjs().add(1, 'hour').format('YYYY-MM-THH:mm'),
        escalation: {
          maxRetries: 1,
          retryIntervalMinutes: 60,
          notifySecondaryOwner: false,
          emergencyEscalation: false,
        },
      });
    } catch {
      toast.error('Failed to create reminder');
    }
  };

  const handleConfirmSnooze = async () => {
    if (!snoozeModalTarget) return;
    try {
      await snoozeMutation.mutateAsync({
        id: snoozeModalTarget._id,
        hours: snoozeHours,
      });
      toast.success(`Reminder snoozed for ${snoozeHours} hour${snoozeHours > 1 ? 's' : ''}`);
      setSnoozeModalTarget(null);
    } catch {
      toast.error('Failed to snooze reminder');
    }
  };

  if (isLoading) {
    return (
      <div className="container-page py-12 max-w-4xl text-center text-muted">
        Loading reminders...
      </div>
    );
  }

  const activeReminders = reminders?.filter((r) => r.isActive) || [];
  const overdue = activeReminders.filter((r) => new Date(r.nextTrigger) < new Date());
  const upcoming = activeReminders.filter((r) => new Date(r.nextTrigger) >= new Date());

  return (
    <div className="container-page max-w-4xl py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-foreground">
            <BellRing className="w-8 h-8 text-primary" /> Pet Reminders
          </h1>
          <p className="text-muted text-sm mt-1">
            Automated schedules, smart snooze, and multi-tier escalation for your pets.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 shadow-md shadow-primary/20 transition"
        >
          <Plus className="w-4 h-4" /> New Reminder
        </button>
      </div>

      {/* Overdue Section */}
      {overdue.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-danger flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Overdue Reminders ({overdue.length})
          </h2>
          <div className="grid gap-3">
            {overdue.map((reminder) => (
              <ReminderCard
                key={reminder._id}
                reminder={reminder}
                onComplete={() => completeMutation.mutate(reminder._id)}
                onOpenSnooze={() => {
                  setSnoozeModalTarget(reminder);
                  setSnoozeHours(1);
                }}
                isOverdue
              />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Section */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" /> Upcoming Reminders
        </h2>
        {upcoming.length === 0 ? (
          <div className="card p-12 text-center border-2 border-dashed border-border flex flex-col items-center justify-center">
            <BellRing className="w-12 h-12 text-muted/40 mb-3" />
            <h3 className="font-semibold text-foreground">No upcoming reminders</h3>
            <p className="text-xs text-muted mt-1 mb-4">
              Schedule medications, vaccination booster dates, and vet visits.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 shadow-sm"
            >
              Create First Reminder
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {upcoming.map((reminder) => (
              <ReminderCard
                key={reminder._id}
                reminder={reminder}
                onComplete={() => completeMutation.mutate(reminder._id)}
                onOpenSnooze={() => {
                  setSnoozeModalTarget(reminder);
                  setSnoozeHours(4);
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Snooze Modal */}
      {snoozeModalTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-surface border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Moon className="w-4 h-4 text-primary" /> Snooze Reminder
              </h3>
              <button
                onClick={() => setSnoozeModalTarget(null)}
                className="text-muted hover:text-foreground p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-muted">
              Select how long to postpone <strong className="text-foreground">{snoozeModalTarget.title}</strong>:
            </p>

            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 4, 8, 24, 48].map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setSnoozeHours(h)}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border transition ${
                    snoozeHours === h
                      ? 'bg-primary text-white border-primary'
                      : 'bg-surface-2 text-foreground border-border hover:bg-surface-3'
                  }`}
                >
                  {h >= 24 ? `${h / 24} Day${h / 24 > 1 ? 's' : ''}` : `${h} Hr${h > 1 ? 's' : ''}`}
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <button
                onClick={() => setSnoozeModalTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-muted hover:bg-surface-2 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSnooze}
                disabled={snoozeMutation.isPending}
                className="px-4 py-2 text-xs font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 shadow-sm disabled:opacity-60"
              >
                {snoozeMutation.isPending ? 'Snoozing...' : `Snooze (${snoozeHours}h)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Reminder Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-surface border border-border p-6 shadow-2xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <BellRing className="w-5 h-5 text-primary" /> Create New Reminder
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted hover:text-foreground p-1 rounded-lg hover:bg-surface-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Pet Select */}
              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">Target Pet</label>
                <select
                  value={form.petId}
                  onChange={(e) => setForm({ ...form, petId: e.target.value })}
                  className="input w-full"
                  required
                >
                  <option value="">-- Choose Pet --</option>
                  {pets.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.species} • {p.breed || 'Pet'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Heartgard Chews (Monthly)"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">Instructions / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Give with morning breakfast"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="input w-full"
                />
              </div>

              {/* Type, Priority, Frequency */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted uppercase mb-1">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="input w-full capitalize text-xs"
                  >
                    <option value="medication">Medication</option>
                    <option value="vaccination">Vaccination</option>
                    <option value="appointment">Appointment</option>
                    <option value="grooming">Grooming</option>
                    <option value="checkup">Checkup</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted uppercase mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as PriorityLevel })}
                    className="input w-full capitalize text-xs"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted uppercase mb-1">Frequency</label>
                  <select
                    value={form.frequency}
                    onChange={(e) => setForm({ ...form, frequency: e.target.value as ReminderFrequency })}
                    className="input w-full capitalize text-xs"
                  >
                    <option value="once">Once</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="custom">Custom (Cron)</option>
                  </select>
                </div>
              </div>

              {/* Custom Cron Builder (when frequency === 'custom') */}
              {form.frequency === 'custom' && (
                <div className="p-3.5 bg-surface-2 rounded-xl border border-primary/20 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                    <Repeat className="w-3.5 h-3.5" /> Custom Cron Schedule
                  </div>

                  {/* Preset chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {CRON_PRESETS.map((p) => (
                      <button
                        key={p.expr}
                        type="button"
                        onClick={() => setForm({ ...form, cronExpression: p.expr })}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                          form.cronExpression === p.expr
                            ? 'bg-primary text-white border-primary'
                            : 'bg-surface text-muted hover:text-foreground border-border'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-muted uppercase mb-1">
                      Cron Expression (standard 5-part)
                    </label>
                    <input
                      type="text"
                      value={form.cronExpression}
                      onChange={(e) => setForm({ ...form, cronExpression: e.target.value })}
                      placeholder="e.g. 0 8 * * *"
                      className="input w-full font-mono text-xs"
                      required
                    />
                    <p className="text-[10px] text-muted mt-1">
                      Format: minute hour day-of-month month day-of-week
                    </p>
                  </div>
                </div>
              )}

              {/* Date & Time */}
              <div>
                <label className="block text-xs font-semibold text-muted uppercase mb-1">First Trigger Time</label>
                <input
                  type="datetime-local"
                  value={form.nextTrigger}
                  onChange={(e) => setForm({ ...form, nextTrigger: e.target.value })}
                  className="input w-full text-xs"
                  required
                />
              </div>

              {/* Escalation Configuration Accordion */}
              <div className="border border-border rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowEscalation(!showEscalation)}
                  className="w-full p-3 bg-surface-2 flex items-center justify-between text-xs font-bold text-foreground hover:bg-surface-3 transition"
                >
                  <span className="flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-500" /> Escalation & Dispatch Settings
                  </span>
                  {showEscalation ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showEscalation && (
                  <div className="p-4 space-y-3 bg-surface text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-muted uppercase mb-1">
                          Max Retry Attempts
                        </label>
                        <select
                          value={form.escalation.maxRetries}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              escalation: { ...form.escalation, maxRetries: Number(e.target.value) },
                            })
                          }
                          className="input w-full text-xs"
                        >
                          <option value={0}>0 (No retries)</option>
                          <option value={1}>1 Retry</option>
                          <option value={2}>2 Retries</option>
                          <option value={3}>3 Retries</option>
                          <option value={5}>5 Retries</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-muted uppercase mb-1">
                          Retry Interval
                        </label>
                        <select
                          value={form.escalation.retryIntervalMinutes}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              escalation: { ...form.escalation, retryIntervalMinutes: Number(e.target.value) },
                            })
                          }
                          className="input w-full text-xs"
                        >
                          <option value={15}>Every 15 min</option>
                          <option value={30}>Every 30 min</option>
                          <option value={60}>Every 60 min (1 hr)</option>
                          <option value={120}>Every 120 min (2 hrs)</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1 border-t border-border">
                      <label className="flex items-center gap-2 cursor-pointer text-muted hover:text-foreground">
                        <input
                          type="checkbox"
                          checked={form.escalation.notifySecondaryOwner}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              escalation: { ...form.escalation, notifySecondaryOwner: e.target.checked },
                            })
                          }
                          className="rounded border-border text-primary focus:ring-primary"
                        />
                        <span>Notify secondary emergency contact if unacknowledged</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-muted hover:text-foreground">
                        <input
                          type="checkbox"
                          checked={form.escalation.emergencyEscalation}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              escalation: { ...form.escalation, emergencyEscalation: e.target.checked },
                            })
                          }
                          className="rounded border-border text-danger focus:ring-danger"
                        />
                        <span>Escalate to Emergency Alert if missed repeatedly</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-medium text-muted hover:bg-surface-2 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-5 py-2 text-xs font-semibold bg-primary text-white rounded-xl hover:bg-primary/90 shadow-md shadow-primary/20 disabled:opacity-60"
                >
                  {createMutation.isPending ? 'Creating...' : 'Create Reminder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ReminderCard({
  reminder,
  onComplete,
  onOpenSnooze,
  isOverdue = false,
}: {
  reminder: IReminder;
  onComplete: () => void;
  onOpenSnooze: () => void;
  isOverdue?: boolean;
}) {
  const time = dayjs(reminder.nextTrigger);
  const color = isOverdue
    ? 'bg-danger/5 border-danger/30'
    : 'bg-surface border-border hover:border-primary/40';

  return (
    <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition ${color}`}>
      <div className="flex gap-3.5 items-start sm:items-center">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
            isOverdue ? 'bg-danger text-white' : 'bg-primary/10 text-primary'
          }`}
        >
          <BellRing className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-foreground">{reminder.title}</h3>
            {reminder.priority && reminder.priority !== 'medium' && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                  reminder.priority === 'emergency' || reminder.priority === 'critical'
                    ? 'bg-danger/10 text-danger'
                    : 'bg-amber-500/10 text-amber-600'
                }`}
              >
                {reminder.priority}
              </span>
            )}
            {reminder.snoozedUntil && (
              <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-purple-500/10 text-purple-600">
                Snoozed
              </span>
            )}
          </div>

          {reminder.message && <p className="text-xs text-muted mt-0.5">{reminder.message}</p>}

          <div className="flex flex-wrap items-center gap-3 text-xs mt-2 text-muted">
            <span className={`flex items-center gap-1 ${isOverdue ? 'text-danger font-semibold' : ''}`}>
              <Clock className="w-3.5 h-3.5" /> {time.format('MMM D, h:mm A')} ({time.fromNow()})
            </span>
            <span className="capitalize text-primary font-medium">
              {reminder.type} • {reminder.frequency}
              {reminder.frequency === 'custom' && reminder.cronExpression && (
                <span className="font-mono text-[10px] ml-1 bg-surface-2 px-1 rounded">
                  ({reminder.cronExpression})
                </span>
              )}
            </span>
            {reminder.escalation && reminder.escalation.maxRetries > 0 && (
              <span className="text-[11px] text-muted">
                Retries: {reminder.escalation.maxRetries}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        <button
          onClick={onOpenSnooze}
          className="px-3.5 py-1.5 text-xs font-semibold text-foreground bg-surface-2 hover:bg-surface-3 rounded-xl border border-border transition flex items-center gap-1"
        >
          <Moon className="w-3.5 h-3.5 text-muted" /> Snooze
        </button>
        <button
          onClick={onComplete}
          className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition flex items-center gap-1 shadow-sm"
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> Done
        </button>
      </div>
    </div>
  );
}