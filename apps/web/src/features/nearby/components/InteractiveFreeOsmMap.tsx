import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { IClinic } from '@petverse/shared-types';
import {
  MapPin,
  Phone,
  Star,
  ShieldCheck,
  Navigation,
  Globe,
  Clock,
  AlertTriangle,
  Locate,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  X,
  ExternalLink,
} from 'lucide-react';
import { loadLeaflet } from '@/shared/lib/leafletLoader';

export const HYDERABAD_CENTER = {
  lat: 17.385,
  lng: 78.4867,
};

interface InteractiveFreeOsmMapProps {
  clinics: (IClinic & { distanceKm?: number })[];
  userCoords?: { lat: number; lng: number } | null;
  selectedClinicId?: string | null;
  onSelectClinic?: (clinicId: string) => void;
  height?: string;
  className?: string;
}

export function InteractiveFreeOsmMap({
  clinics,
  userCoords,
  selectedClinicId,
  onSelectClinic,
  height = '600px',
  className = '',
}: InteractiveFreeOsmMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeClinic, setActiveClinic] = useState<(IClinic & { distanceKm?: number }) | null>(null);

  // Sync activeClinic with selectedClinicId prop from parent
  useEffect(() => {
    if (selectedClinicId) {
      const found = clinics.find((c) => (c.placeId || c._id) === selectedClinicId);
      if (found) {
        setActiveClinic(found);
        if (mapInstanceRef.current && found.location?.coordinates) {
          const [lng, lat] = found.location.coordinates;
          mapInstanceRef.current.flyTo([lat, lng], 15, { duration: 0.8 });
        }
      }
    }
  }, [selectedClinicId, clinics]);

  // Initialize Leaflet OpenStreetMap
  useEffect(() => {
    let isMounted = true;

    if (!mapContainerRef.current) return;

    loadLeaflet()
      .then((L) => {
        if (!isMounted || !mapContainerRef.current) return;

        // If map already initialized, just invalidate size
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
          return;
        }

        const initialLat = userCoords?.lat ?? HYDERABAD_CENTER.lat;
        const initialLng = userCoords?.lng ?? HYDERABAD_CENTER.lng;

        // Create Leaflet map instance
        const map = L.map(mapContainerRef.current, {
          center: [initialLat, initialLng],
          zoom: userCoords ? 13 : 12,
          zoomControl: false, // Custom controls
          attributionControl: true,
        });

        // Add CartoDB Voyager / OpenStreetMap free tiles (sleek, high-res, zero-cost)
        L.tileLayer(
          'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
          {
            attribution:
              '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/" target="_blank">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19,
          }
        ).addTo(map);

        mapInstanceRef.current = map;
        setMapLoaded(true);
      })
      .catch((err) => {
        if (!isMounted) return;
        setLoadError(err?.message || 'Failed to load OpenStreetMap');
      });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Run once on mount

  // Render clinic markers when map & clinics are ready
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || typeof window === 'undefined' || !window.L) return;

    const L = window.L;
    const map = mapInstanceRef.current;

    // Clear previous markers
    for (const m of markersRef.current) {
      map.removeLayer(m);
    }
    markersRef.current = [];

    // Render User Location Pin if available
    if (userCoords?.lat && userCoords?.lng) {
      if (userMarkerRef.current) {
        map.removeLayer(userMarkerRef.current);
      }

      const userIcon = L.divIcon({
        className: 'custom-user-marker',
        html: `
          <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 24px; height: 24px; border-radius: 9999px; background: rgba(59, 130, 246, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="width: 14px; height: 14px; border-radius: 9999px; background: #2563eb; border: 2px solid #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      userMarkerRef.current = L.marker([userCoords.lat, userCoords.lng], {
        icon: userIcon,
        zIndexOffset: 1000,
      })
        .addTo(map)
        .bindPopup('<strong style="font-family: sans-serif; font-size: 13px;">Your Current Location</strong>');
    }

    // Render Clinic Markers
    for (const clinic of clinics) {
      if (!clinic.location?.coordinates) continue;
      const [lng, lat] = clinic.location.coordinates;
      if (typeof lat !== 'number' || typeof lng !== 'number') continue;

      const clinicKey = clinic.placeId || clinic._id;
      const isSelected = activeClinic && (activeClinic.placeId || activeClinic._id) === clinicKey;
      const isEmergency = clinic.emergencyAvailable === true;

      // Color scheme
      const bgColor = isSelected ? '#10b981' : isEmergency ? '#f43f5e' : '#4f46e5';
      const shadowColor = isSelected
        ? 'rgba(16, 185, 129, 0.6)'
        : isEmergency
        ? 'rgba(244, 63, 94, 0.5)'
        : 'rgba(79, 70, 229, 0.5)';
      const scale = isSelected ? 'scale(1.2)' : 'scale(1)';

      const markerHtml = `
        <div style="transform: ${scale}; transition: transform 0.2s; cursor: pointer;">
          <div style="width: 32px; height: 32px; border-radius: 50% 50% 50% 0; background: ${bgColor}; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px ${shadowColor}; border: 2px solid #ffffff;">
            <div style="transform: rotate(45deg); color: #ffffff; font-size: 13px; font-weight: bold; display: flex; align-items: center; justify-content: center;">
              ${isEmergency ? '✚' : '★'}
            </div>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-clinic-marker',
        html: markerHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -30],
      });

      const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

      marker.on('click', () => {
        setActiveClinic(clinic);
        if (onSelectClinic) {
          onSelectClinic(clinicKey);
        }
      });

      markersRef.current.push(marker);
    }
  }, [mapLoaded, clinics, activeClinic, userCoords, onSelectClinic]);

  // Handler: Locate user
  const handleLocateMe = useCallback(() => {
    if (!mapInstanceRef.current) return;
    if (userCoords?.lat && userCoords?.lng) {
      mapInstanceRef.current.flyTo([userCoords.lat, userCoords.lng], 15, { duration: 0.8 });
    } else {
      mapInstanceRef.current.flyTo([HYDERABAD_CENTER.lat, HYDERABAD_CENTER.lng], 13, { duration: 0.8 });
    }
  }, [userCoords]);

  // Handler: Reset Hyderabad View
  const handleResetView = useCallback(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([HYDERABAD_CENTER.lat, HYDERABAD_CENTER.lng], 12, { duration: 0.8 });
    setActiveClinic(null);
  }, []);

  // Handler: Zoom In
  const handleZoomIn = useCallback(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.zoomIn();
  }, []);

  // Handler: Zoom Out
  const handleZoomOut = useCallback(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.zoomOut();
  }, []);

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-slate-100 dark:bg-slate-900 ${className}`}
      style={{ height }}
    >
      {/* OpenStreetMap Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Loading Skeleton */}
      {!mapLoaded && !loadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/90 dark:bg-slate-900/90 z-20 backdrop-blur-sm">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Loading Free Interactive Map...
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Powered by OpenStreetMap (100% Free at zero cost)
          </p>
        </div>
      )}

      {/* Error Fallback */}
      {loadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-6 z-20 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mb-3" />
          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base mb-1">
            Map Preview
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mb-4">
            {loadError}. Showing clinic details from the directory below.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Map Control Buttons (Floating Top Right) */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <button
          onClick={handleLocateMe}
          title="Near Me (My Location)"
          aria-label="Locate user"
          className="p-2.5 bg-white/95 dark:bg-slate-800/95 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95"
        >
          <Locate className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </button>
        <button
          onClick={handleResetView}
          title="Reset Hyderabad View"
          aria-label="Reset map view"
          className="p-2.5 bg-white/95 dark:bg-slate-800/95 hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 transition-all hover:scale-105 active:scale-95"
        >
          <RotateCcw className="w-4 h-4 text-slate-600 dark:text-slate-300" />
        </button>
        <div className="flex flex-col rounded-xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95">
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            aria-label="Zoom in"
            className="p-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border-b border-slate-200 dark:border-slate-700 transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            aria-label="Zoom out"
            className="p-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Free OpenStreetMap Status Badge (Floating Top Left) */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 dark:bg-slate-800/95 shadow-md border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>OpenStreetMap • 100% Free</span>
        <span className="text-slate-400">|</span>
        <span className="text-slate-500">{clinics.length} Clinics</span>
      </div>

      {/* Active Clinic Floating Info Card (Bottom) */}
      {activeClinic && (
        <div className="absolute bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-md z-10 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 relative">
            {/* Close Button */}
            <button
              onClick={() => setActiveClinic(null)}
              className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              aria-label="Close card"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header: Name & Badges */}
            <div className="pr-6">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {activeClinic.emergencyAvailable && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 text-[10px] font-bold">
                    <AlertTriangle className="w-3 h-3" />
                    24/7 EMERGENCY
                  </span>
                )}
                {activeClinic.isOpenNow !== undefined && (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      activeClinic.isOpenNow
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    {activeClinic.isOpenNow ? 'Open Now' : 'Closed'}
                  </span>
                )}
                {activeClinic.locality && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-medium">
                    {activeClinic.locality}
                  </span>
                )}
              </div>

              <h4 className="font-bold text-slate-900 dark:text-white text-base leading-snug line-clamp-1">
                {activeClinic.name}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                {activeClinic.address}
              </p>
            </div>

            {/* Metrics: Rating & Distance */}
            <div className="flex items-center gap-4 my-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-1 text-amber-500 font-semibold">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{activeClinic.ratings?.avg ? activeClinic.ratings.avg.toFixed(1) : '4.6'}</span>
                {activeClinic.ratings?.count ? (
                  <span className="text-slate-400 font-normal">({activeClinic.ratings.count})</span>
                ) : null}
              </div>

              {activeClinic.distanceKm !== undefined && (
                <div className="flex items-center gap-1 text-slate-500 font-medium">
                  <Navigation className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{activeClinic.distanceKm} km away</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mt-2">
              <a
                href={
                  activeClinic.googleMapsUri ||
                  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                    activeClinic.name
                  )}+${encodeURIComponent(activeClinic.address)}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
              >
                <Navigation className="w-3.5 h-3.5" />
                Get Directions (Free)
              </a>

              {activeClinic.phone && (
                <a
                  href={`tel:${activeClinic.phone}`}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition-all"
                  title="Call Clinic"
                >
                  <Phone className="w-3.5 h-3.5" />
                  Call
                </a>
              )}

              {activeClinic.website && (
                <a
                  href={activeClinic.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  title="Visit Website"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
