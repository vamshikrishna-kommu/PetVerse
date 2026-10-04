import { useState } from 'react';
import type { IClinic } from '@petverse/shared-types';
import { MapPin, Phone, Star, ShieldCheck, Navigation } from 'lucide-react';

interface InteractiveMapProps {
  clinics: (IClinic & { distanceKm?: number })[];
  userCoords?: { lat: number; lng: number } | null;
  selectedClinicId?: string;
  onSelectClinic?: (clinicId: string) => void;
  height?: string;
}

export function InteractiveMap({
  clinics,
  userCoords,
  selectedClinicId,
  onSelectClinic,
  height = '450px',
}: InteractiveMapProps) {
  const [activeClinic, setActiveClinic] = useState<(IClinic & { distanceKm?: number }) | null>(
    clinics.find((c) => c._id === selectedClinicId) || clinics[0] || null
  );

  // Center on active clinic, user coords, or default to Hyderabad, Telangana
  const centerLat = activeClinic?.location?.coordinates?.[1] || userCoords?.lat || 17.4156;
  const centerLng = activeClinic?.location?.coordinates?.[0] || userCoords?.lng || 78.4350;

  const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // If Google Maps API key is configured and valid, we can embed it
  const isGoogleMapsEnabled = Boolean(googleMapsKey && googleMapsKey !== 'your-google-maps-api-key');

  const mapSrc = isGoogleMapsEnabled
    ? `https://www.google.com/maps/embed/v1/search?key=${googleMapsKey}&q=veterinary+clinic&center=${centerLat},${centerLng}&zoom=13`
    : `https://www.openstreetmap.org/export/embed.html?bbox=${centerLng - 0.08}%2C${centerLat - 0.05}%2C${centerLng + 0.08}%2C${centerLat + 0.05}&layer=mapnik&marker=${centerLat}%2C${centerLng}`;

  return (
    <div className="relative rounded-2xl overflow-hidden border border-border bg-surface-2 shadow-sm" style={{ height }}>
      {/* Map Embed Container */}
      <iframe
        title="Nearby Veterinary Clinics Map"
        width="100%"
        height="100%"
        src={mapSrc}
        className="w-full h-full border-0 filter dark:invert-[0.88] dark:hue-rotate-180"
        loading="lazy"
      />

      {/* Floating Interactive Controls / Clinic Selector */}
      <div className="absolute top-3 left-3 right-3 sm:right-auto sm:max-w-sm z-10 space-y-2 pointer-events-none">
        {activeClinic && (
          <div className="card p-4 bg-surface/95 backdrop-blur-md border-border shadow-xl rounded-2xl pointer-events-auto">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <span className="badge bg-primary/10 text-primary border-primary/20 text-[10px] capitalize">
                  {activeClinic.type ? activeClinic.type.replace('_', ' ') : 'Clinic'}
                </span>
                <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5 mt-1">
                  {activeClinic.name}
                  {activeClinic.isVerified && <ShieldCheck className="h-4 w-4 text-primary shrink-0" />}
                </h4>
              </div>
              {activeClinic.ratings?.avg && (
                <div className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-lg shrink-0">
                  <Star className="h-3 w-3 fill-amber-500" />
                  {activeClinic.ratings.avg}
                </div>
              )}
            </div>

            <p className="text-xs text-muted flex items-start gap-1.5 mb-3">
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <span>{activeClinic.address}</span>
            </p>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
              {activeClinic.phone ? (
                <a
                  href={`tel:${activeClinic.phone}`}
                  className="btn-secondary py-1 px-2.5 text-[11px] font-semibold flex items-center gap-1.5"
                >
                  <Phone className="h-3 w-3" />
                  Call
                </a>
              ) : (
                <span />
              )}

              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${activeClinic.location?.coordinates?.[1]},${activeClinic.location?.coordinates?.[0]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary py-1 px-3 text-[11px] font-semibold flex items-center gap-1.5"
              >
                <Navigation className="h-3 w-3" />
                Directions
              </a>
            </div>
          </div>
        )}

        {/* Quick Marker Selector Chips */}
        {clinics.length > 1 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full pointer-events-auto">
            {clinics.map((c) => {
              const isActive = activeClinic?._id === c._id;
              return (
                <button
                  key={c._id}
                  onClick={() => {
                    setActiveClinic(c);
                    onSelectClinic?.(c._id);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap shadow-md backdrop-blur-sm border transition-all ${
                    isActive
                      ? 'bg-primary text-white border-primary ring-2 ring-primary/30'
                      : 'bg-surface/90 text-foreground border-border hover:bg-surface-2'
                  }`}
                >
                  <span className="truncate max-w-[120px] inline-block">{c.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Privacy Notice */}
      <div className="absolute bottom-2 right-2 z-10 text-[9px] text-muted bg-surface/80 px-2 py-0.5 rounded backdrop-blur-sm pointer-events-none">
        Location coordinates protected • No telemetry retained
      </div>
    </div>
  );
}
