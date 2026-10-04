import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Map as MapIcon,
  List as ListIcon,
  Navigation,
} from 'lucide-react';
import { Skeleton } from '@/shared/components/feedback/Skeleton';
import { InteractiveMap } from '../components/InteractiveMap';
import { toast } from 'sonner';

const HYDERABAD_COORDS = { lat: 17.4156, lng: 78.4350 };

const HYDERABAD_LOCALITIES = [
  { id: 'all', label: 'All Hyderabad', query: '' },
  { id: 'banjara', label: 'Banjara Hills', query: 'Banjara Hills' },
  { id: 'jubilee', label: 'Jubilee Hills', query: 'Jubilee Hills' },
  { id: 'gachibowli', label: 'Gachibowli', query: 'Gachibowli' },
  { id: 'madhapur', label: 'Madhapur', query: 'Madhapur' },
  { id: 'kondapur', label: 'Kondapur', query: 'Kondapur' },
  { id: 'kukatpally', label: 'Kukatpally', query: 'Kukatpally' },
  { id: 'secunderabad', label: 'Secunderabad', query: 'Secunderabad' },
  { id: 'abids', label: 'Abids / Central', query: 'Abids' },
];

export default function NearbyPage() {
  const navigate = useNavigate();

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(HYDERABAD_COORDS);
  const [isLiveGps, setIsLiveGps] = useState<boolean>(false);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedLocality, setSelectedLocality] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [radiusKm, setRadiusKm] = useState<number>(35);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

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
          setGeoNotice('Using Hyderabad city coordinates (GPS permission not granted).');
          setCoords(HYDERABAD_COORDS);
          setIsLiveGps(false);
        },
        { timeout: 7000, enableHighAccuracy: true }
      );
    } else {
      setGeoNotice('Using Hyderabad city coordinates.');
      setCoords(HYDERABAD_COORDS);
      setIsLiveGps(false);
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  const handleLocalitySelect = (locId: string, query: string) => {
    setSelectedLocality(locId);
    setSearchQuery(query);
  };

  const { data: clinics, isLoading } = useNearbyServices({
    lat: coords?.lat,
    lng: coords?.lng,
    radiusKm: coords ? radiusKm : undefined,
    type: selectedType || undefined,
    search: searchQuery || undefined,
  });

  const categories = [
    { id: '', label: 'All Services', icon: Compass },
    { id: 'veterinary_clinic', label: 'Vet Clinics', icon: Stethoscope },
    { id: 'emergency_hospital', label: '24/7 Emergency', icon: AlertTriangle },
    { id: 'groomer', label: 'Grooming', icon: Scissors },
    { id: 'boarding', label: 'Boarding', icon: Home },
  ];

  return (
    <div className="container-page py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="badge bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[11px] font-semibold flex items-center gap-1.5 py-0.5 px-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {isLiveGps ? 'Live GPS Location' : 'Hyderabad, Telangana'}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Nearby Pet Care & Clinics</h1>
          <p className="text-sm text-muted mt-1">
            Discover verified veterinary practices, 24/7 animal hospitals, and grooming spas in Hyderabad.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-surface-2 p-1 rounded-xl border border-border shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'list'
                ? 'bg-surface text-primary shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <ListIcon className="h-3.5 w-3.5" />
            List
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'map'
                ? 'bg-surface text-primary shadow-sm'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <MapIcon className="h-3.5 w-3.5" />
            Map View
          </button>
        </div>
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
            className="btn-secondary py-1 px-2.5 text-[11px] font-semibold flex items-center gap-1 shrink-0"
          >
            <Navigation className="h-3 w-3" />
            Enable My Location
          </button>
        </div>
      )}

      {/* Hyderabad Locality Quick-Filter Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1">
            <MapPin className="w-3 h-3 text-primary" /> Hyderabad Neighborhoods
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

      {/* Filter & Search Bar */}
      <div className="card p-4 mb-6 bg-surface border-border flex flex-col md:flex-row gap-3 items-center rounded-2xl">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted" />
          <input
            type="text"
            placeholder="Search by clinic name, address, or service (e.g. Banjara Hills, ICU, Surgery)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSelectedLocality('all');
            }}
            className="input pl-10 w-full text-xs"
          />
        </div>

        {coords && (
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <span className="text-xs font-semibold uppercase text-muted">Radius:</span>
            <select
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className="input text-xs py-2 w-full sm:w-auto"
            >
              <option value={5}>Within 5 km</option>
              <option value={10}>Within 10 km</option>
              <option value={25}>Within 25 km</option>
              <option value={50}>Within 50 km</option>
            </select>
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex border-b border-border mb-6 overflow-x-auto no-scrollbar gap-2 pb-2">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedType === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedType(cat.id)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-surface-2 text-foreground/80 border-border hover:border-primary/40'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Content Rendering: Map vs List */}
      {viewMode === 'map' ? (
        <div className="space-y-6">
          <InteractiveMap
            clinics={clinics || []}
            userCoords={coords}
            height="520px"
          />

          {/* Quick list below map */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(clinics || []).slice(0, 6).map((c) => (
              <div
                key={c._id}
                onClick={() => navigate(`/nearby/${c._id}`)}
                className="card p-4 border-border hover:border-primary/50 transition-all cursor-pointer flex justify-between items-center"
              >
                <div>
                  <h4 className="text-xs font-bold text-foreground">{c.name}</h4>
                  <p className="text-[11px] text-muted truncate max-w-[200px]">{c.address}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted" />
              </div>
            ))}
          </div>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card p-6 border-border space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-8 w-full mt-4" />
            </div>
          ))}
        </div>
      ) : !clinics || clinics.length === 0 ? (
        <div className="card p-12 text-center border-border">
          <Compass className="h-10 w-10 text-muted mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-foreground">No Clinics Found</h3>
          <p className="text-xs text-muted max-w-sm mx-auto mt-1">
            Try adjusting your search criteria, clearing category filters, or expanding your search radius.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clinics.map((c) => (
            <div
              key={c._id}
              className="card overflow-hidden border-border hover:border-primary/40 transition-all flex flex-col justify-between group rounded-2xl"
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="badge bg-primary/10 text-primary border-primary/20 capitalize mb-2 inline-block text-[10px]">
                      {c.type ? c.type.replace('_', ' ') : 'Service'}
                    </span>
                    <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                      {c.name}
                      {c.isVerified && <ShieldCheck className="h-4 w-4 text-primary shrink-0" />}
                    </h3>
                  </div>
                  {c.emergencyAvailable && (
                    <span className="badge bg-danger/10 text-danger border-danger/20 shrink-0 text-[10px]">
                      24/7 ER
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted flex items-center gap-1.5 mb-4">
                  <MapPin className="h-3.5 w-3.5 text-muted shrink-0" /> {c.address}
                </p>

                {c.services && c.services.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {c.services.slice(0, 3).map((s) => (
                      <span key={s} className="badge bg-surface-2 text-foreground text-[10px]">
                        {s}
                      </span>
                    ))}
                    {c.services.length > 3 && (
                      <span className="text-[10px] text-muted self-center">
                        +{c.services.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="p-4 bg-surface-2/50 border-t border-border flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 font-bold text-amber-500">
                  <Star className="h-3.5 w-3.5 fill-amber-500" />
                  {c.ratings?.avg ? c.ratings.avg : 'New'}
                  {c.ratings?.count ? (
                    <span className="text-muted font-normal text-[11px]">({c.ratings.count})</span>
                  ) : null}
                </div>

                {c.distanceKm !== undefined && (
                  <span className="font-semibold text-primary">{c.distanceKm} km away</span>
                )}

                <button
                  onClick={() => navigate(`/nearby/${c._id}`)}
                  className="flex items-center gap-1 font-semibold text-foreground hover:text-primary transition-colors"
                >
                  Details <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}