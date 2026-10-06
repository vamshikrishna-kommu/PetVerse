import React from 'react';
import type { IClinic } from '@petverse/shared-types';
import { InteractiveGoogleMap } from './InteractiveGoogleMap';

interface InteractiveMapProps {
  clinics: (IClinic & { distanceKm?: number })[];
  userCoords?: { lat: number; lng: number } | null;
  selectedClinicId?: string | null;
  onSelectClinic?: (clinicId: string) => void;
  height?: string;
  className?: string;
}

export function InteractiveMap(props: InteractiveMapProps) {
  return <InteractiveGoogleMap {...props} />;
}

export { InteractiveGoogleMap };
