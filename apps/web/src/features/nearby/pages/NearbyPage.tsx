import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useNearbyServices } from '../hooks/useNearby';
import {
  MapPin,
  Search,
  Star,
  ShieldCheck,
  AlertTriangle,
  Stethoscope,
  Scissors,
  Home,
  ChevronRight,
  Compass,
  Navigation,
  Phone,
  Globe,
  Clock,
  Calendar,
  Locate,
  Info,
} from 'lucide-react';
import { Skeleton } from '@/shared/components/feedback/Skeleton';
import { InteractiveGoogleMap, HYDERABAD_CENTER } from '../components/InteractiveGoogleMap';
import { toast } from 'sonner';

export const HYDERABAD_LOCALITIES = [
  { id: 'all', label: 'All Hyderabad', query: '' },
  { id: 'gachibowli', label: 'Gachibowli', query: 'Gachibowli' },
  { id: 'madhapur', label: 'Madhapur', query: 'Madhapur' },
  { id: 'kondapur', label: 'Kondapur', query: 'Kondapur' },
  { id: 'hitech_city', label: 'Hitech City', query: 'Hitech City' },
  { id: 'jubilee_hills', label: 'Jubilee Hills', query: 'Jubilee Hills' },
  { id: 'banjara_hills', label: 'Banjara Hills', query: 'Banjara Hills' },
  { id: 'kukatpally', label: 'Kukatpally', query: 'Kukatpally' },
  { id: 'secunderabad', label: 'Secunderabad', query: 'Secunderabad' },
  { id: 'begumpet', label: 'Begumpet', query: 'Begumpet' },
  { id: 'ameerpet', label: 'Ameerpet', query: 'Ameerpet' },
  { id: 'lb_nagar', label: 'LB Nagar', query: 'LB Nagar' },
  { id: 'dilsukhnagar', label: 'Dilsukhnagar', query: 'Dilsukhnagar' },
  { id: 'uppal', label: 'Uppal', query: 'Uppal' },
  { id: 'manikonda', label: 'Manikonda', query: 'Manikonda' },
  { id: 'miyapur', label: 'Miyapur', query: 'Miyapur' },
  { id: 'mehdipatnam', label: 'Mehdipatnam', query: 'Mehdipatnam' },
  { id: 'tolichowki', label: 'Tolichowki', query: 'Tolichowki' },
  { id: 'kompally', label: 'Kompally', query: 'Kompally' },
];

export default function NearbyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Location State
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(HYDERABAD_CENTER);
  const [isLiveGps, setIsLiveGps] = useState<boolean>(false);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);

  // Filter States
  const [searchInput, setSearchInput] = useState<string>(searchParams.get('search') || searchParams.get('q') || '');
  const [debouncedSearch, setDebouncedSearch] = useState<string>(searchParams.get('search') || searchParams.get('q') || '');
  const [selectedLocality, setSelectedLocality] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('');
  const [radiusKm, setRadiusKm] = useState<number>(25);
  const [emergencyOnly, setEmergencyOnly] = useState<boolean>(false);
  const [openNowOnly, setOpenNowOnly] = useState<boolean>(false);
  const [minRating, setMinRating] = useState<number>(0);

  useEffect(() => {
    const q = searchParams.get('search') || searchParams.get('q');
    if (q !== null && q !== searchInput) {
      setSearchInput(q);
      setDebouncedSearch(q.trim());
    }
  }, [searchParams]);

  // Interaction State
  const [selectedClinicId, setSelectedClinicId] = useState<string | null>(null);
  const clinicListRef = useRef<HTMLDivElement>(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Request browser geolocation
  const requestLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setIsLiveGps(true);
          setGeoNotice(null);
          toast.success('Live GPS location updated');
        },
        () => {
          setGeoNotice('Location permission not granted. Showing Hyderabad city center by default.');
          setCoords(HYDERABAD_CENTER);
          setIsLiveGps(false);
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      setGeoNotice('Browser does not support geolocation. Showing Hyderabad city center.');
      setCoords(HYDERABAD_CENTER);
      setIsLiveGps(false);
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  const handleLocalitySelect = (locId: string, query: string) => {
    setSelectedLocality(locId);
    setSearchInput(query);
  };

  // Query nearby services
  const queryParams = useMemo(() => {
    const activeLocality = HYDERABAD_LOCALITIES.find((l) => l.id === selectedLocality);
    return {
      lat: coords?.lat,
      lng: coords?.lng,
      radiusKm: coords ? radiusKm : undefined,
      type: selectedType || undefined,
      search: debouncedSearch || undefined,
      locality: activeLocality?.query || undefined,
      emergencyOnly: emergencyOnly || undefined,
      openNow: openNowOnly || undefined,
      minRating: minRating > 0 ? minRating : undefined,
    };
  }, [coords, radiusKm, selectedType, debouncedSearch, selectedLocality, emergencyOnly, openNowOnly, minRating]);

  const { data: clinics, isLoading, isError } = useNearbyServices(queryParams);

  const categories = [
    { id: '', label: 'All Services', icon: Compass },
    { id: 'veterinary_clinic', label: 'Vet Clinics', icon: Stethoscope },
    { id: 'emergency_hospital', label: '24/7 Emergency', icon: AlertTriangle },
    { id: 'groomer', label: 'Grooming', icon: Scissors },
    { id: 'boarding', label: 'Boarding', icon: Home },
  ];

  // Synchronized Selection: scroll clinic card into view when selected on map
  const handleSelectClinic = (clinicId: string) => {
    setSelectedClinicId(clinicId);
    const element = document.getElementById(`clinic-card-${clinicId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="container-page py-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="badge bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[11px] font-semibold flex items-center gap-1.5 py-0.5 px-2.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isLiveGps ? 'bg-emerald-500 animate-pulse' : 'bg-emerald-500'}`} />
              {isLiveGps ? 'Live GPS Location' : 'Hyderabad Directory'}
            </span>
            <span className="badge bg-primary/10 text-primary border-primary/20 text-[11px] font-semibold flex items-center gap-1 py-0.5 px-2.5">
              Powered by Google Places
            </span>
            <span className="badge bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[11px] font-semibold flex items-center gap-1 py-0.5 px-2.5">
              100% Free (Zero API Cost)
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
            Hyderabad Veterinary Directory
          </h1>
          <p className="text-sm text-muted mt-1">
            Discover verified veterinary clinics, 24/7 animal hospitals, and pet healthcare facilities in Hyderabad.
          </p>
        </div>

        {/* Geolocation Button */}
        <button
          onClick={requestLocation}
          className="btn-secondary py-2 px-3.5 text-xs font-semibold flex items-center gap-2 self-start md:self-auto shrink-0 shadow-sm"
        >
          <Locate className="h-4 w-4 text-primary" />
          {isLiveGps ? 'Refresh GPS Location' : 'Use Current Location'}
        </button>
      </div>

      {/* Geolocation Notice Banner */}
      {geoNotice && (
        <div className="mb-6 card bg-surface-2 border-border p-3 text-xs text-foreground/80 flex items-center justify-between gap-2 rounded-xl">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary shrink-0" />
            <span>{geoNotice}</span>
          </div>
          <button
            onClick={requestLocation}
            className="btn-primary py-1 px-2.5 text-[11px] font-semibold flex items-center gap-1 shrink-0"
          >
            Enable Location
          </button>
        </div>
      )}

      {/* Hyderabad Neighborhoods Quick-Filter Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-primary" /> Hyderabad Localities
          </span>
          {selectedLocality !== 'all' && (
            <button
              onClick={() => handleLocalitySelect('all', '')}
              className="text-[11px] text-primary hover:underline font-semibold"
            >
              Reset to All Hyderabad
            </button>
          )}
        </div>
        <div className="flex overflow-x-auto no-scrollbar gap-1.5 pb-1">
          {HYDERABAD_LOCALITIES.map((loc) => {
            const isSelected = selectedLocality === loc.id;
            return (
              <button
                key={loc.id}
                onClick={() => handleLocalitySelect(loc.id, loc.query)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-surface-2 text-foreground/80 border-border hover:border-primary/40'
                }`}
              >
                {loc.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Filter & Search Control Panel */}
      <div className="card p-4 mb-6 bg-surface border-border rounded-2xl space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted" />
            <input
              type="text"
              placeholder="Search by clinic name, address, or locality (e.g. Olive Pet Hospital, Gachibowli, Banjara Hills)..."
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                if (selectedLocality !== 'all') {
                  setSelectedLocality('all');
                }
              }}
              className="input pl-10 w-full text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            {/* Radius Selector */}
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <span className="font-semibold">Radius:</span>
              <select
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="input text-xs py-1.5 px-2.5"
              >
                <option value={5}>Within 5 km</option>
                <option value={10}>Within 10 km</option>
                <option value={25}>Within 25 km</option>
                <option value={50}>Within 50 km</option>
              </select>
            </div>

            {/* Min Rating Selector */}
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <span className="font-semibold">Rating:</span>
              <select
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="input text-xs py-1.5 px-2.5"
              >
                <option value={0}>Any Rating</option>
                <option value={4.0}>4.0+ Stars</option>
                <option value={4.5}>4.5+ Stars</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filter Badges & Quick Toggles */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
          <button
            onClick={() => setEmergencyOnly(!emergencyOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              emergencyOnly
                ? 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                : 'bg-surface-2 text-foreground/80 border-border hover:border-rose-500/30'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            24/7 Emergency Care
          </button>

          <button
            onClick={() => setOpenNowOnly(!openNowOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              openNowOnly
                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                : 'bg-surface-2 text-foreground/80 border-border hover:border-emerald-500/30'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-emerald-500" />
            Open Now
          </button>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 ml-auto overflow-x-auto no-scrollbar">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedType === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedType(cat.id)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-surface-2 text-muted border-border hover:text-foreground'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold text-muted">
          {isLoading ? (
            'Searching veterinary clinics in Hyderabad...'
          ) : clinics && clinics.length > 0 ? (
            `Veterinary clinics found in Hyderabad: ${clinics.length}`
          ) : (
            'No veterinary clinics found matching your criteria.'
          )}
        </p>

        {selectedClinicId && (
          <button
            onClick={() => setSelectedClinicId(null)}
            className="text-xs text-primary font-semibold hover:underline"
          >
            Clear Selected Clinic
          </button>
        )}
      </div>

      {/* Main Split Layout: Desktop (Clinic List Left | Map Right) & Mobile (Map Top | Cards Below) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Clinic Cards List */}
        <div ref={clinicListRef} className="lg:col-span-7 space-y-4 order-2 lg:order-1">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card p-5 border-border space-y-3 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <div className="flex gap-2 pt-2">
                    <Skeleton className="h-8 w-24 rounded-lg" />
                    <Skeleton className="h-8 w-24 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="card p-10 text-center border-border rounded-2xl space-y-3">
              <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto" />
              <h3 className="text-base font-bold text-foreground">Failed to Load Clinics</h3>
              <p className="text-xs text-muted max-w-sm mx-auto">
                We encountered an issue discovering nearby clinics. Click below to reload the directory.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="btn-primary py-2 px-5 text-xs font-semibold mx-auto inline-flex items-center gap-1.5"
              >
                Reload Directory
              </button>
            </div>
          ) : !clinics || clinics.length === 0 ? (
            <div className="card p-12 text-center border-border rounded-2xl">
              <Compass className="h-10 w-10 text-muted mx-auto mb-3 opacity-60" />
              <h3 className="text-base font-bold text-foreground">No Clinics Found in Hyderabad</h3>
              <p className="text-xs text-muted max-w-sm mx-auto mt-1 mb-4">
                Try widening your search radius, selecting a different neighborhood, or clearing your active filters.
              </p>
              <button
                onClick={() => {
                  setSearchInput('');
                  setSelectedLocality('all');
                  setSelectedType('');
                  setEmergencyOnly(false);
                  setOpenNowOnly(false);
                  setMinRating(0);
                }}
                className="btn-secondary py-1.5 px-4 text-xs font-semibold mx-auto"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {clinics.map((clinic) => {
                const clinicKey = clinic.placeId || clinic._id;
                const isSelected = selectedClinicId === clinicKey;
                const isEmergency = clinic.emergencyAvailable;

                return (
                  <div
                    key={clinicKey}
                    id={`clinic-card-${clinicKey}`}
                    onClick={() => setSelectedClinicId(clinicKey)}
                    className={`card p-5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-md'
                        : 'border-border hover:border-primary/40 bg-surface'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className="badge bg-primary/10 text-primary border-primary/20 text-[10px] capitalize">
                            {clinic.type?.replace('_', ' ') || 'Veterinary Clinic'}
                          </span>
                          {isEmergency && (
                            <span className="badge bg-rose-500/10 text-rose-600 border-rose-500/20 text-[10px] font-bold flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" /> 24/7 Emergency
                            </span>
                          )}
                          {clinic.locality && (
                            <span className="badge bg-surface-2 text-foreground/80 border-border text-[10px]">
                              {clinic.locality}
                            </span>
                          )}
                          {clinic.isOpenNow !== undefined && (
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                clinic.isOpenNow
                                  ? 'bg-emerald-500/10 text-emerald-600'
                                  : 'bg-zinc-500/10 text-muted'
                              }`}
                            >
                              {clinic.isOpenNow ? 'Open Now' : 'Closed'}
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-foreground flex items-center gap-1.5">
                          {clinic.name}
                          {clinic.isVerified && (
                            <span title="Verified Provider">
                              <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                            </span>
                          )}
                        </h3>
                      </div>

                      {/* Rating */}
                      {clinic.ratings?.avg ? (
                        <div className="flex items-center gap-1 font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-lg shrink-0 text-xs">
                          <Star className="h-3.5 w-3.5 fill-amber-500" />
                          {clinic.ratings.avg}
                          {clinic.ratings.count ? (
                            <span className="text-[10px] text-muted font-normal">
                              ({clinic.ratings.count})
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    {/* Address & Distance */}
                    <p className="text-xs text-muted flex items-start gap-1.5 mb-2">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{clinic.address}</span>
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted mb-3">
                      {clinic.distanceKm !== undefined && (
                        <span className="font-semibold text-foreground flex items-center gap-1">
                          <Navigation className="w-3 h-3 text-primary" />
                          {clinic.distanceKm} km away
                        </span>
                      )}
                      {clinic.source === 'google_places' && (
                        <span className="text-[11px] text-muted flex items-center gap-1">
                          <Info className="w-3 h-3 text-muted" /> Sourced via Google Places
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border">
                      {/* Directions */}
                      <a
                        href={
                          clinic.googleMapsUri ||
                          `https://www.google.com/maps/dir/?api=1&destination=${clinic.location?.coordinates?.[1]},${clinic.location?.coordinates?.[0]}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="btn-primary py-1.5 px-3.5 text-xs font-semibold flex items-center gap-1.5"
                      >
                        <Navigation className="h-3.5 w-3.5" />
                        Directions
                      </a>

                      {/* Phone */}
                      {clinic.phone && (
                        <a
                          href={`tel:${clinic.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="btn-secondary py-1.5 px-3 text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Phone className="h-3.5 w-3.5 text-primary" />
                          Call
                        </a>
                      )}

                      {/* Website */}
                      {clinic.website && (
                        <a
                          href={clinic.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="btn-secondary py-1.5 px-3 text-xs font-semibold flex items-center gap-1.5"
                        >
                          <Globe className="h-3.5 w-3.5" />
                          Website
                        </a>
                      )}

                      {/* Book Appointment */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/appointments/book?clinicId=${clinic._id}`);
                        }}
                        className="btn-secondary py-1.5 px-3 text-xs font-semibold flex items-center gap-1.5 text-primary border-primary/30 hover:bg-primary/10 transition-colors"
                      >
                        <Calendar className="h-3.5 w-3.5" />
                        Book Appointment
                      </button>

                      {/* View Details */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/nearby/${clinicKey}`);
                        }}
                        className="ml-auto text-xs font-semibold text-muted hover:text-foreground flex items-center gap-1 py-1 px-2"
                      >
                        View Details
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Sticky Interactive Google Map */}
        <div className="lg:col-span-5 order-1 lg:order-2 lg:sticky lg:top-20">
          <InteractiveGoogleMap
            clinics={clinics || []}
            userCoords={coords}
            selectedClinicId={selectedClinicId}
            onSelectClinic={handleSelectClinic}
          />
        </div>
      </div>
    </div>
  );
}