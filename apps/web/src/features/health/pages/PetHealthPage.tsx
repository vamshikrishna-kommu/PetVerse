import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usePet } from '@/features/pets/hooks/usePets';
import { useHealthDashboard, useAllergies } from '../hooks/useHealth';
import { Skeleton } from '@/shared/components/feedback/Skeleton';
import { ArrowLeft, Activity, Stethoscope, Pill, AlertTriangle, ChevronRight, TestTube, FileVideo, Scissors } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import { HealthScoreRing } from '../components/HealthScoreRing';
import { ConditionBadge } from '../components/ConditionBadge';
import { AllergyTag } from '../components/AllergyTag';
import { PrescriptionItem } from '../components/PrescriptionItem';
import { EmptyHealthState } from '../components/EmptyHealthState';
import { format } from 'date-fns';

type Tab = 'overview' | 'vitals' | 'conditions' | 'records' | 'labs' | 'imaging' | 'surgeries';

export default function PetHealthPage() {
  const { petId } = useParams<{ petId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const { data: pet, isLoading: isLoadingPet } = usePet(petId as string);
  const { data: dashboard, isLoading: isLoadingHealth } = useHealthDashboard(petId as string);
  const { data: allergies = [] } = useAllergies(petId as string);

  if (isLoadingPet || isLoadingHealth) {
    return (
      <div className="container-page py-8">
        <Skeleton className="h-10 w-32 mb-6" />
        <Skeleton className="h-64 w-full rounded-2xl mb-8" />
        <div className="grid md:grid-cols-3 gap-6">
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!pet || !dashboard) {
    return (
      <div className="container-page py-8 text-center">
        <h2 className="text-2xl font-bold">Health Profile Not Found</h2>
        <button onClick={() => navigate('/pets')} className="text-primary mt-4 hover:underline">
          Return to Pets
        </button>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(`/pets/${petId}`)}
            className="flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Profile
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-8">
        {pet.avatar ? (
          <img src={pet.avatar} alt={pet.name} className="w-16 h-16 rounded-full object-cover border-2 border-primary/20" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold">
            {pet.name.charAt(0)}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            {pet.name}'s Health Hub
          </h1>
          <p className="text-muted">Comprehensive medical record & health tracking</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto no-scrollbar border-b border-slate-200 dark:border-slate-800 mb-8 pb-px">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={cn(
              "flex items-center gap-2 px-5 py-3 text-sm font-semibold whitespace-nowrap transition-colors relative",
              activeTab === tab.id 
                ? "text-primary" 
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Health Score & Alerts Row */}
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="card bg-surface-2 p-6 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Activity className="w-24 h-24 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-muted uppercase tracking-wider mb-6 w-full text-left relative z-10">
                  Overall Health Score
                </h3>
                <HealthScoreRing score={dashboard.healthScore.score} size={160} strokeWidth={10} className="relative z-10" />
                <p className="mt-4 text-sm text-muted text-center max-w-[200px] relative z-10">
                  Based on recent vitals, conditions, and activity.
                </p>
              </div>

              <div className="lg:col-span-2 space-y-6">
                <div className="card p-6">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-warning" /> 
                    Active Alerts & Reminders
                  </h3>
                  {dashboard.alerts.length === 0 ? (
                    <EmptyHealthState 
                      title="All good!" 
                      description="No active health alerts for your pet." 
                      className="py-4"
                    />
                  ) : (
                    <div className="space-y-3">
                      {dashboard.alerts.map((alert, i) => (
                        <div key={i} className={cn(
                          "p-4 rounded-xl border flex items-start gap-3",
                          alert.severity === 'critical' ? 'bg-red-50/50 border-red-200 text-red-900 dark:bg-red-900/10 dark:border-red-800 dark:text-red-300' :
                          alert.severity === 'severe' || alert.severity === 'moderate' ? 'bg-yellow-50/50 border-yellow-200 text-yellow-900 dark:bg-yellow-900/10 dark:border-yellow-800 dark:text-yellow-300' :
                          'bg-blue-50/50 border-blue-200 text-blue-900 dark:bg-blue-900/10 dark:border-blue-800 dark:text-blue-300'
                        )}>
                          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-sm">{alert.title}</h4>
                            <p className="text-sm opacity-90">{alert.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Conditions & Allergies Row */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-foreground">Active Conditions</h3>
                  <button onClick={() => setActiveTab('conditions')} className="text-sm font-semibold text-primary flex items-center hover:underline">
                    View All <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
                {dashboard.activeConditions.length === 0 ? (
                  <EmptyHealthState title="No conditions" description="Your pet has no active conditions." />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {dashboard.activeConditions.map((cond: any) => (
                      <ConditionBadge key={cond._id} name={cond.name} severity={cond.severity} />
                    ))}
                  </div>
                )}
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-foreground">Allergies</h3>
                  <button onClick={() => setActiveTab('overview')} className="text-sm font-semibold text-primary flex items-center hover:underline">
                    Manage <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
                {allergies.length === 0 ? (
                  <EmptyHealthState title="No allergies" description="No known allergies recorded." />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {allergies.map((allergy: any) => (
                      <AllergyTag key={allergy._id} allergen={allergy.allergen} severity={allergy.severity} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Active Prescriptions */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Pill className="w-5 h-5 text-indigo-500" /> Active Prescriptions
                </h3>
              </div>
              {dashboard.activeMedications.length === 0 ? (
                <EmptyHealthState title="No prescriptions" description="There are no active prescriptions." />
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {dashboard.activeMedications.map((rx: any) => (
                    <PrescriptionItem key={rx._id} prescription={rx} />
                  ))}
                </div>
              )}
            </div>

            {/* Recent Vitals Summary */}
            <div className="card p-6">
               <h3 className="text-lg font-bold text-foreground mb-4">Latest Vitals Summary</h3>
               {!dashboard.latestVitals ? (
                 <EmptyHealthState title="No vitals" description="No vitals have been logged recently." />
               ) : (
                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {dashboard.latestVitals.weight && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-muted mb-1">Weight</p>
                        <p className="font-semibold text-lg">{dashboard.latestVitals.weight} kg</p>
                      </div>
                    )}
                    {dashboard.latestVitals.temperature && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-muted mb-1">Temp</p>
                        <p className="font-semibold text-lg">{dashboard.latestVitals.temperature} °C</p>
                      </div>
                    )}
                    {dashboard.latestVitals.pulse && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-muted mb-1">Heart Rate</p>
                        <p className="font-semibold text-lg">{dashboard.latestVitals.pulse} bpm</p>
                      </div>
                    )}
                    {dashboard.latestVitals.respiratoryRate && (
                      <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                        <p className="text-xs text-muted mb-1">Resp Rate</p>
                        <p className="font-semibold text-lg">{dashboard.latestVitals.respiratoryRate} bpm</p>
                      </div>
                    )}
                 </div>
               )}
            </div>
          </div>
        )}


      </div>
    </div>
  );
}
