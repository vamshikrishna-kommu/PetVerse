import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { nearbyApi, type IClinicWithDistance } from '@/services/api/nearbyApi';
import {
  AlertTriangle,
  PhoneCall,
  MapPin,
  Bot,
  ShieldAlert,
  Flame,
  Droplets,
  HeartPulse,
  Activity,
  ArrowRight,
  ExternalLink,
  Navigation,
  Search,
  Zap,
} from 'lucide-react';
import { Skeleton } from '@/shared/components/feedback/Skeleton';

export default function EmergencyPage() {
  const navigate = useNavigate();
  const [emergencyClinics, setEmergencyClinics] = useState<IClinicWithDistance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [protocolSearch, setProtocolSearch] = useState('');

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const HYDERABAD_COORDS = { lat: 17.4156, lng: 78.4350 };

    const fetchClinics = (lat: number = HYDERABAD_COORDS.lat, lng: number = HYDERABAD_COORDS.lng) => {
      nearbyApi
        .getNearbyServices({ lat, lng, radiusKm: 35 })
        .then((clinics) => {
          if (isMounted) {
            // Prioritize verified 24/7 emergency facilities
            const emergencyFirst = [...clinics].sort((a, b) => {
              if (a.emergencyAvailable && !b.emergencyAvailable) return -1;
              if (!a.emergencyAvailable && b.emergencyAvailable) return 1;
              return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
            });
            setEmergencyClinics(emergencyFirst.slice(0, 3));
            setIsError(false);
          }
        })
        .catch((err: unknown) => {
          if (isMounted) {
            console.warn('Could not load nearby emergency clinics', err);
            setIsError(true);
          }
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchClinics(pos.coords.latitude, pos.coords.longitude),
        () => fetchClinics(HYDERABAD_COORDS.lat, HYDERABAD_COORDS.lng),
        { timeout: 5000 }
      );
    } else {
      fetchClinics(HYDERABAD_COORDS.lat, HYDERABAD_COORDS.lng);
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const emergencyProtocols = [
    {
      title: 'Poison or Toxin Ingestion',
      keywords: 'poison chocolate rodenticide plant medication vomit toxin',
      icon: Droplets,
      color: 'text-amber-500 bg-amber-500/10',
      action: 'Do NOT induce vomiting unless instructed by a vet. Identify the ingested packaging or plant and call Poison Control immediately.',
    },
    {
      title: 'Severe Bleeding or Trauma',
      keywords: 'bleeding blood cut wound hit by car hemorrhage pressure',
      icon: ShieldAlert,
      color: 'text-rose-500 bg-rose-500/10',
      action: 'Apply firm, continuous pressure with a clean cloth. Do not remove saturated bandages; layer more on top and transport immediately.',
    },
    {
      title: 'Choking or Labored Breathing',
      keywords: 'choking breathing suffocation airway cyanosis blue gums asthma',
      icon: Activity,
      color: 'text-purple-500 bg-purple-500/10',
      action: 'Check oral cavity carefully without getting bitten. If unresponsive, perform gentle chest compressions and rush to nearest emergency room.',
    },
    {
      title: 'Heatstroke / Overheating',
      keywords: 'heatstroke hot panting collapse exhaustion summer sun dehydration',
      icon: Flame,
      color: 'text-rose-500 bg-rose-500/10',
      action: 'Move to shade immediately. Wet fur with lukewarm (NOT ice-cold) water. Offer small sips of water and seek urgent clinical evaluation.',
    },
    {
      title: 'Seizures & Convulsions',
      keywords: 'seizure tremor shaking epilepsy convulsion fit',
      icon: Zap,
      color: 'text-indigo-500 bg-indigo-500/10',
      action: 'Clear nearby furniture. Do not put hands in pet\'s mouth. Time the seizure, keep lights dim and quiet, transport immediately if lasting > 3 minutes.',
    },
  ];

  const filteredProtocols = emergencyProtocols.filter(
    (p) =>
      p.title.toLowerCase().includes(protocolSearch.toLowerCase()) ||
      p.keywords.toLowerCase().includes(protocolSearch.toLowerCase())
  );

  return (
    <div className="container-page max-w-5xl py-8 space-y-8">
      {/* Critical Banner */}
      <div className="card p-4 sm:p-6 bg-rose-500/10 border-rose-500/30 space-y-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="p-2.5 sm:p-3 bg-rose-600 text-white rounded-2xl shrink-0">
            <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 animate-pulse" />
          </div>
          <div className="space-y-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">Emergency Pet Care Hotline</h1>
            <p className="text-xs sm:text-sm text-foreground leading-relaxed">
              If your pet is unconscious, seizing, bleeding profusely, or having severe breathing difficulty, transport them immediately to the nearest 24/7 veterinary hospital.
            </p>
          </div>
        </div>

        {/* Rapid Hotline Dials & Emergency Actions */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <a
            href="tel:1962"
            className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-card border border-rose-500/20 hover:border-rose-500 transition group shadow-sm gap-2"
          >
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <PhoneCall className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500 group-hover:scale-110 transition-transform shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-bold text-foreground truncate">Telangana Animal Ambulance</p>
                <p className="text-xs sm:text-sm font-extrabold text-rose-600">1962 (Toll Free)</p>
              </div>
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 uppercase shrink-0">
              24/7 Govt
            </span>
          </a>

          <a
            href="tel:+914023544355"
            className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-card border border-rose-500/20 hover:border-rose-500 transition group shadow-sm gap-2"
          >
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <PhoneCall className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500 group-hover:scale-110 transition-transform shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-bold text-foreground truncate">Blue Cross of Hyderabad</p>
                <p className="text-xs sm:text-sm font-extrabold text-rose-600">(040) 2354-4355</p>
              </div>
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 uppercase shrink-0">
              24/7 ER
            </span>
          </a>

          <a
            href="tel:+919394085852"
            className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-card border border-rose-500/20 hover:border-rose-500 transition group shadow-sm gap-2"
          >
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <PhoneCall className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500 group-hover:scale-110 transition-transform shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] sm:text-xs font-bold text-foreground truncate">Hyderabad Rescue Dispatch</p>
                <p className="text-xs sm:text-sm font-extrabold text-rose-600">+91 93940 85852</p>
              </div>
            </div>
            <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 uppercase shrink-0">
              Rescue
            </span>
          </a>

          <button
            onClick={() => navigate('/lost-found')}
            className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white transition group shadow-sm gap-2"
          >
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 text-white group-hover:scale-110 transition-transform shrink-0" />
              <div className="text-left min-w-0">
                <p className="text-[11px] sm:text-xs font-bold opacity-90 truncate">Pet Missing / Lost?</p>
                <p className="text-xs sm:text-sm font-extrabold truncate">Broadcast SOS Alert</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 opacity-80 shrink-0" />
          </button>
        </div>
      </div>

      {/* AI Triage Link */}
      <div className="card p-6 border-primary/20 bg-gradient-to-r from-primary/5 via-card to-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-primary/10 text-primary">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Instant Symptom Triage Assessment</h3>
            <p className="text-xs text-muted mt-0.5">
              Input symptoms to evaluate clinical urgency, check red flags, and receive first-aid guidance.
            </p>
          </div>
        </div>
        <Link
          to="/ai/symptoms"
          className="px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-xl hover:bg-primary/90 transition shadow-md shadow-primary/20 flex items-center gap-1.5 shrink-0 self-start sm:self-center"
        >
          Start AI Triage <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Nearby 24/7 Emergency Clinics */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" /> Nearest Emergency Care Providers
            </h2>
            <p className="text-xs text-muted">Locally verified veterinary clinics and animal hospitals.</p>
          </div>
          <Link to="/nearby" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
            View All Clinics <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="card p-6 text-center text-muted text-xs">
            Could not fetch real-time geolocation clinics. Please call the hotline numbers above or use the directory below.
          </div>
        ) : emergencyClinics.length === 0 ? (
          <div className="card p-6 text-center text-muted text-xs">
            No local clinics currently mapped. Use the hotline numbers above for immediate tele-triage.
          </div>
        ) : (
          <div className="grid sm:grid-cols-3 gap-4">
            {emergencyClinics.map((clinic) => (
              <div key={clinic._id} className="card p-5 border-border hover:border-primary/30 transition flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-foreground">{clinic.name}</h4>
                    {clinic.distanceKm !== undefined && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {clinic.distanceKm} km away
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted mt-1 truncate">{clinic.address}</p>
                </div>
                <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
                  <a
                    href={`tel:${clinic.phone}`}
                    className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline"
                  >
                    <PhoneCall className="w-3.5 h-3.5" /> Call
                  </a>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(clinic.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-foreground hover:text-primary flex items-center gap-1"
                  >
                    <Navigation className="w-3.5 h-3.5" /> Route
                  </a>
                  <Link
                    to={`/nearby/${clinic._id}`}
                    className="text-xs text-muted hover:text-foreground flex items-center gap-0.5"
                  >
                    Details <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* First Aid Guidance Search & Cards */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-primary" /> Emergency First-Aid Protocols
            </h2>
            <p className="text-xs text-muted">Immediate triage actions while preparing transport.</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search protocol (e.g. poison, bleeding)..."
              value={protocolSearch}
              onChange={(e) => setProtocolSearch(e.target.value)}
              className="w-full bg-card border border-border rounded-xl pl-9 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {filteredProtocols.length === 0 ? (
          <div className="card p-6 text-center text-xs text-muted">
            No matching protocol found. For immediate medical guidance, consult the 24/7 hotline numbers above or use the AI Triage assistant.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {filteredProtocols.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="card p-5 border-border space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl ${p.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <h4 className="font-bold text-sm text-foreground">{p.title}</h4>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">{p.action}</p>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}