import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
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
import { loadGoogleMaps, isGoogleMapsConfigured } from '@/shared/lib/googleMapsLoader';
import { InteractiveFreeOsmMap } from './InteractiveFreeOsmMap';

declare const google: any;

export const HYDERABAD_CENTER = {
  lat: 17.3850,
  lng: 78.4867,
};

interface InteractiveGoogleMapProps {
  clinics: (IClinic & { distanceKm?: number })[];
  userCoords?: { lat: number; lng: number } | null;
  selectedClinicId?: string | null;
  onSelectClinic?: (clinicId: string) => void;
  height?: string;
  className?: string;
}

export function InteractiveGoogleMap({
  clinics,
  userCoords,
  selectedClinicId,
  onSelectClinic,
  height = '600px',
  className = '',
}: InteractiveGoogleMapProps) {
  // If Google Maps API key is not configured, seamlessly use 100% Free OpenStreetMap & Leaflet
  if (!isGoogleMapsConfigured()) {
    return (
      <InteractiveFreeOsmMap
        clinics={clinics}
        userCoords={userCoords}
        selectedClinicId={selectedClinicId}
        onSelectClinic={onSelectClinic}
        height={height}
        className={className}
      />
    );
  }

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
        // Center map on selected clinic if map exists
        if (mapInstanceRef.current && found.location?.coordinates) {
          const [lng, lat] = found.location.coordinates;
          mapInstanceRef.current.panTo({ lat, lng });
          if (mapInstanceRef.current.getZoom()! < 14) {
            mapInstanceRef.current.setZoom(14);
          }
        }
      }
    }
  }, [selectedClinicId, clinics]);

  // Initialize Google Map
  useEffect(() => {
    let isCancelled = false;

    if (!isGoogleMapsConfigured()) {
      setLoadError('Google Maps API key is not configured.');
      return;
    }

    loadGoogleMaps()
      .then((maps) => {
        if (isCancelled || !mapContainerRef.current) return;

        const defaultCenter = userCoords || HYDERABAD_CENTER;

        const map = new maps.Map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: 12,
          minZoom: 9,
          maxZoom: 19,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: false, // We render custom zoom buttons
          styles: [
            {
              featureType: 'poi.medical',
              elementType: 'geometry',
              stylers: [{ color: '#f5f5f5' }],
            },
            {
              featureType: 'poi.business',
              stylers: [{ visibility: 'simplified' }],
            },
          ],
        });

        mapInstanceRef.current = map;
        setMapLoaded(true);
        setLoadError(null);
      })
      .catch((err) => {
        if (!isCancelled) {
          setLoadError(err.message || 'Failed to load Google Maps.');
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  // Update User GPS Marker
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setMap(null);
      userMarkerRef.current = null;
    }

    if (userCoords) {
      userMarkerRef.current = new google.maps.Marker({
        position: userCoords,
        map: mapInstanceRef.current,
        title: 'Your Current Location',
        zIndex: 1000,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#3b82f6',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 3,
        },
      });
    }
  }, [userCoords, mapLoaded]);

  // Update Clinic Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const bounds = new google.maps.LatLngBounds();
    let hasValidCoords = false;

    clinics.forEach((clinic) => {
      if (!clinic.location?.coordinates) return;
      const [lng, lat] = clinic.location.coordinates;
      if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) return;

      const clinicKey = clinic.placeId || clinic._id;
      const isSelected = (selectedClinicId && (clinic.placeId || clinic._id) === selectedClinicId) || (activeClinic && (activeClinic.placeId || activeClinic._id) === clinicKey);
      const isEmergency = clinic.emergencyAvailable;

      const markerColor = isSelected ? '#4f46e5' : isEmergency ? '#e11d48' : '#0d9488';
      const markerScale = isSelected ? 12 : 9;

      const marker = new google.maps.Marker({
        position: { lat, lng },
        map: mapInstanceRef.current,
        title: clinic.name,
        zIndex: isSelected ? 999 : isEmergency ? 500 : 100,
        icon: {
          path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: markerScale,
          fillColor: markerColor,
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      marker.addListener('click', () => {
        setActiveClinic(clinic);
        if (onSelectClinic) {
          onSelectClinic(clinicKey);
        }
      });

      markersRef.current.push(marker);
      bounds.extend({ lat, lng });
      hasValidCoords = true;
    });

    // Auto-fit bounds if no clinic is manually selected and multiple markers exist
    if (!selectedClinicId && hasValidCoords && clinics.length > 1) {
      mapInstanceRef.current.fitBounds(bounds, {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50,
      });
    }
  }, [clinics, selectedClinicId, activeClinic, mapLoaded, onSelectClinic]);

  // Recenter on user position
  const handleLocateMe = useCallback(() => {
    if (mapInstanceRef.current && userCoords) {
      mapInstanceRef.current.panTo(userCoords);
      mapInstanceRef.current.setZoom(14);
    }
  }, [userCoords]);

  // Recenter on Hyderabad
  const handleRecenterHyderabad = useCallback(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo(HYDERABAD_CENTER);
      mapInstanceRef.current.setZoom(12);
    }
  }, []);

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom((mapInstanceRef.current.getZoom() || 12) + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom((mapInstanceRef.current.getZoom() || 12) - 1);
    }
  };

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-border bg-surface-2 shadow-sm ${className}`}
      style={{ height }}
    >
      {/* Google Map Container Element */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Fallback View if Google Maps API key is not configured */}
      {loadError && (
        <div className="absolute inset-0 bg-surface-2/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            <MapPin className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-base font-bold text-foreground mb-1">
            Interactive Google Map Preview
          </h3>
          <p className="text-xs text-muted max-w-md mb-4">
            To view full interactive vector maps with real-time marker clusters and GPS routing,
            add your <code className="text-primary font-mono text-[11px]">VITE_GOOGLE_MAPS_API_KEY</code> to your frontend environment.
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {userCoords && (
              <a
                href={`https://www.google.com/maps/search/veterinary+clinic/@${userCoords.lat},${userCoords.lng},13z`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary py-1.5 px-3.5 text-xs flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Hyderabad Clinics on Google Maps
              </a>
            )}
          </div>
        </div>
      )}

      {/* Map Control Buttons (Floating Top Right) */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5 bg-surface/90 backdrop-blur-md p-1.5 rounded-xl border border-border shadow-lg">
        {userCoords && (
          <button
            onClick={handleLocateMe}
            title="Focus Near Me"
            className="p-2 text-foreground/80 hover:text-primary hover:bg-surface-2 rounded-lg transition-colors"
          >
            <Locate className="w-4 h-4 text-blue-500" />
          </button>
        )}
        <button
          onClick={handleRecenterHyderabad}
          title="Recenter Hyderabad"
          className="p-2 text-foreground/80 hover:text-primary hover:bg-surface-2 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <div className="h-px bg-border my-0.5" />
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-2 text-foreground/80 hover:text-primary hover:bg-surface-2 rounded-lg transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-2 text-foreground/80 hover:text-primary hover:bg-surface-2 rounded-lg transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
      </div>

      {/* Powered by Google Places Badge (Floating Bottom Left) */}
      <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface/85 backdrop-blur-md border border-border text-[10px] font-medium text-muted shadow-sm">
          <span>Powered by</span>
          <span className="font-semibold text-foreground">Google Places</span>
        </span>
      </div>

      {/* Floating Selected Clinic Info Card */}
      {activeClinic && (
        <div className="absolute top-4 left-4 right-4 sm:right-auto sm:max-w-sm z-10 animate-in fade-in slide-in-from-top-2">
          <div className="card p-4 bg-surface/95 backdrop-blur-md border-border shadow-2xl rounded-2xl">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  <span className="badge bg-primary/10 text-primary border-primary/20 text-[10px] capitalize">
                    {activeClinic.type?.replace('_', ' ') || 'Veterinary Clinic'}
                  </span>
                  {activeClinic.emergencyAvailable && (
                    <span className="badge bg-rose-500/10 text-rose-600 border-rose-500/20 text-[10px] font-bold flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" /> 24/7 Emergency
                    </span>
                  )}
                  {activeClinic.isOpenNow !== undefined && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        activeClinic.isOpenNow
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : 'bg-zinc-500/10 text-muted'
                      }`}
                    >
                      {activeClinic.isOpenNow ? 'Open Now' : 'Closed'}
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  {activeClinic.name}
                  {activeClinic.isVerified && (
                    <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                  )}
                </h4>
              </div>
              <button
                onClick={() => setActiveClinic(null)}
                className="text-muted hover:text-foreground p-1 rounded-lg transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Rating & Distance */}
            <div className="flex items-center gap-3 text-xs mb-2">
              {activeClinic.ratings?.avg ? (
                <div className="flex items-center gap-1 font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md">
                  <Star className="h-3 w-3 fill-amber-500" />
                  {activeClinic.ratings.avg}
                  {activeClinic.ratings.count ? (
                    <span className="text-[10px] text-muted font-normal">
                      ({activeClinic.ratings.count})
                    </span>
                  ) : null}
                </div>
              ) : null}

              {activeClinic.distanceKm !== undefined && (
                <span className="text-muted font-medium flex items-center gap-1">
                  <Navigation className="w-3 h-3 text-primary" />
                  {activeClinic.distanceKm} km away
                </span>
              )}
            </div>

            {/* Address */}
            <p className="text-xs text-muted flex items-start gap-1.5 mb-3">
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
              <span>{activeClinic.address}</span>
            </p>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              {activeClinic.phone && (
                <a
                  href={`tel:${activeClinic.phone}`}
                  className="btn-secondary py-1.5 px-3 text-[11px] font-semibold flex items-center gap-1.5 flex-1 justify-center"
                >
                  <Phone className="h-3 w-3 text-primary" />
                  Call
                </a>
              )}

              {activeClinic.website && (
                <a
                  href={activeClinic.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary py-1.5 px-3 text-[11px] font-semibold flex items-center gap-1.5"
                >
                  <Globe className="h-3 w-3" />
                  Website
                </a>
              )}

              <a
                href={
                  activeClinic.googleMapsUri ||
                  `https://www.google.com/maps/dir/?api=1&destination=${activeClinic.location?.coordinates?.[1]},${activeClinic.location?.coordinates?.[0]}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary py-1.5 px-3 text-[11px] font-semibold flex items-center gap-1.5 flex-1 justify-center"
              >
                <Navigation className="h-3 w-3" />
                Directions
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
