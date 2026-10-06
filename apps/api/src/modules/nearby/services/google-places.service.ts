import { env, isConfiguredCredential } from '../../../config/env';
import { logger } from '../../../shared/utils/logger';
import type { IClinic } from '@petverse/shared-types';

export const HYDERABAD_CENTER = {
  lat: 17.3850,
  lng: 78.4867,
};

export const HYDERABAD_LOCALITIES = [
  'Gachibowli',
  'Madhapur',
  'Kondapur',
  'Hitech City',
  'Jubilee Hills',
  'Banjara Hills',
  'Kukatpally',
  'Secunderabad',
  'Begumpet',
  'Ameerpet',
  'LB Nagar',
  'Dilsukhnagar',
  'Uppal',
  'Manikonda',
  'Miyapur',
  'Mehdipatnam',
  'Tolichowki',
  'Kompally',
  'Sainikpuri',
  'Bowenpally',
  'Himayatnagar',
  'Narayanguda',
  'Abids',
  'Somajiguda',
  'Nallagandla',
  'Tellapur',
  'Attapur',
  'Alwal',
] as const;

export type HyderabadLocality = (typeof HYDERABAD_LOCALITIES)[number];

interface CacheEntry {
  timestamp: number;
  data: IClinic[];
}

const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours in-memory TTL (compliant with Google 30-day max cache policy)
const searchCache = new Map<string, CacheEntry>();
const placeDetailsCache = new Map<string, { timestamp: number; data: IClinic }>();

export interface GooglePlacesSearchOptions {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  search?: string;
  locality?: string;
  emergencyOnly?: boolean;
  openNow?: boolean;
  minRating?: number;
}

/**
 * Calculates straight-line distance in kilometers using the Haversine formula
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Detects known Hyderabad locality from the returned formatted address.
 * Never invents or artificially assigns localities.
 */
export function matchLocalityFromAddress(address?: string): string | undefined {
  if (!address) return undefined;
  for (const loc of HYDERABAD_LOCALITIES) {
    const regex = new RegExp(`\\b${loc}\\b`, 'i');
    if (regex.test(address)) {
      return loc;
    }
  }
  return undefined;
}

/**
 * Checks if clinic offers emergency/critical veterinary care based on actual source data.
 */
function isEmergencyCare(
  types?: string[],
  name?: string,
  openNow?: boolean,
  weekdayDescriptions?: string[]
): boolean {
  const text = `${name || ''} ${(types || []).join(' ')}`.toLowerCase();
  const hasEmergencyKeyword =
    text.includes('emergency') ||
    text.includes('24/7') ||
    text.includes('24 hours') ||
    text.includes('24 hr') ||
    text.includes('critical care') ||
    text.includes('trauma');

  if (hasEmergencyKeyword) return true;

  // Check if opening hours mention 24 hours
  if (weekdayDescriptions && weekdayDescriptions.some((d) => d.toLowerCase().includes('open 24 hours'))) {
    return true;
  }

  return false;
}

/**
 * Derives user-facing service tags from Google Places types
 */
function deriveServices(types?: string[], name?: string): string[] {
  const services = new Set<string>();
  const text = (name || '').toLowerCase();

  services.add('Veterinary Consultation');
  services.add('Pet Healthcare');

  if (text.includes('hospital') || (types && types.includes('hospital'))) {
    services.add('In-Patient Care');
    services.add('Surgery & Diagnostics');
  }

  if (text.includes('emergency') || text.includes('24/7') || text.includes('critical')) {
    services.add('24/7 Emergency Care');
    services.add('ICU & Trauma Support');
  }

  if (text.includes('dental') || text.includes('dentistry')) {
    services.add('Veterinary Dentistry');
  }

  if (text.includes('surgery') || text.includes('surgical')) {
    services.add('Surgical Procedures');
  }

  if (text.includes('vaccin') || text.includes('immuniz')) {
    services.add('Vaccination & Deworming');
  }

  return Array.from(services);
}

/**
 * Normalizes a place object from Google Places API (New) into standard IClinic DTO
 */
function normalizePlaceNew(place: any, userLat?: number, userLng?: number): IClinic {
  const id = place.id || place.name?.split('/').pop() || '';
  const lat = place.location?.latitude ?? HYDERABAD_CENTER.lat;
  const lng = place.location?.longitude ?? HYDERABAD_CENTER.lng;
  const name = place.displayName?.text || place.displayName || 'Veterinary Clinic';
  const address = place.formattedAddress || '';
  const weekdayDescriptions: string[] | undefined =
    place.regularOpeningHours?.weekdayDescriptions || undefined;
  const isOpenNow: boolean | undefined =
    typeof place.currentOpeningHours?.openNow === 'boolean'
      ? place.currentOpeningHours.openNow
      : typeof place.regularOpeningHours?.openNow === 'boolean'
      ? place.regularOpeningHours.openNow
      : undefined;

  const emergencyAvailable = isEmergencyCare(place.types, name, isOpenNow, weekdayDescriptions);

  let distanceKm: number | undefined = undefined;
  if (typeof userLat === 'number' && typeof userLng === 'number') {
    distanceKm = calculateDistanceKm(userLat, userLng, lat, lng);
  }

  return {
    _id: id,
    placeId: id,
    name,
    address,
    locality: matchLocalityFromAddress(address),
    type: emergencyAvailable ? 'emergency_hospital' : 'veterinary_clinic',
    location: {
      type: 'Point',
      coordinates: [lng, lat],
    },
    phone: place.nationalPhoneNumber || place.internationalPhoneNumber || undefined,
    website: place.websiteUri || undefined,
    services: deriveServices(place.types, name),
    weekdayDescriptions,
    photos: place.photos ? place.photos.map((p: any) => p.name || p.photo_reference).filter(Boolean) : [],
    ratings: {
      avg: typeof place.rating === 'number' ? Number(place.rating.toFixed(1)) : 0,
      count: typeof place.userRatingCount === 'number' ? place.userRatingCount : 0,
    },
    isVerified: true,
    emergencyAvailable,
    isOpenNow,
    googleMapsUri: place.googleMapsUri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}+${encodeURIComponent(address)}`,
    source: 'google_places',
    hasOnlineBooking: false,
    distanceKm,
  };
}

/**
 * Normalizes a place object from standard/legacy Google Places API into standard IClinic DTO
 */
function normalizePlaceLegacy(place: any, userLat?: number, userLng?: number): IClinic {
  const id = place.place_id || place.id || '';
  const lat = place.geometry?.location?.lat ?? HYDERABAD_CENTER.lat;
  const lng = place.geometry?.location?.lng ?? HYDERABAD_CENTER.lng;
  const name = place.name || 'Veterinary Clinic';
  const address = place.formatted_address || place.vicinity || '';
  const weekdayDescriptions: string[] | undefined =
    place.opening_hours?.weekday_text || undefined;
  const isOpenNow: boolean | undefined =
    typeof place.opening_hours?.open_now === 'boolean'
      ? place.opening_hours.open_now
      : undefined;

  const emergencyAvailable = isEmergencyCare(place.types, name, isOpenNow, weekdayDescriptions);

  let distanceKm: number | undefined = undefined;
  if (typeof userLat === 'number' && typeof userLng === 'number') {
    distanceKm = calculateDistanceKm(userLat, userLng, lat, lng);
  }

  return {
    _id: id,
    placeId: id,
    name,
    address,
    locality: matchLocalityFromAddress(address),
    type: emergencyAvailable ? 'emergency_hospital' : 'veterinary_clinic',
    location: {
      type: 'Point',
      coordinates: [lng, lat],
    },
    phone: place.formatted_phone_number || place.international_phone_number || undefined,
    website: place.website || undefined,
    services: deriveServices(place.types, name),
    weekdayDescriptions,
    photos: place.photos ? place.photos.map((p: any) => p.photo_reference).filter(Boolean) : [],
    ratings: {
      avg: typeof place.rating === 'number' ? Number(place.rating.toFixed(1)) : 0,
      count: typeof place.user_ratings_total === 'number' ? place.user_ratings_total : 0,
    },
    isVerified: true,
    emergencyAvailable,
    isOpenNow,
    googleMapsUri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}+${encodeURIComponent(address)}`,
    source: 'google_places',
    hasOnlineBooking: false,
    distanceKm,
  };
}

export const googlePlacesService = {
  /**
   * Checks whether the server has a valid Google Maps API Key configured
   */
  isConfigured(): boolean {
    return isConfiguredCredential(env.GOOGLE_MAPS_API_KEY);
  },

  /**
   * Search for veterinary clinics using Google Places API (New) Text Search
   */
  async searchWithPlacesNew(
    queryText: string,
    centerLat: number,
    centerLng: number,
    radiusMeters: number
  ): Promise<any[]> {
    const apiKey = env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return [];

    const url = 'https://places.googleapis.com/v1/places:searchText';
    const fieldMask = [
      'places.id',
      'places.displayName',
      'places.formattedAddress',
      'places.location',
      'places.rating',
      'places.userRatingCount',
      'places.internationalPhoneNumber',
      'places.nationalPhoneNumber',
      'places.websiteUri',
      'places.regularOpeningHours',
      'places.currentOpeningHours',
      'places.types',
      'places.googleMapsUri',
    ].join(',');

    const body = {
      textQuery: queryText,
      locationBias: {
        circle: {
          center: {
            latitude: centerLat,
            longitude: centerLng,
          },
          radius: radiusMeters,
        },
      },
      maxResultCount: 20,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': fieldMask,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      logger.warn(`Google Places API (New) responded with HTTP ${response.status}: ${errText}`);
      throw new Error(`Google Places API (New) error: ${response.status}`);
    }

    const json = (await response.json()) as any;
    return json.places || [];
  },

  /**
   * Fallback to standard Places API Text Search
   */
  async searchWithPlacesLegacy(
    queryText: string,
    centerLat: number,
    centerLng: number,
    radiusMeters: number
  ): Promise<any[]> {
    const apiKey = env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return [];

    const params = new URLSearchParams({
      query: queryText,
      location: `${centerLat},${centerLng}`,
      radius: String(radiusMeters),
      key: apiKey,
    });

    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) {
      logger.warn(`Legacy Google Places API responded with HTTP ${response.status}`);
      return [];
    }

    const json = (await response.json()) as any;
    if (json.status !== 'OK' && json.status !== 'ZERO_RESULTS') {
      logger.warn(`Legacy Google Places API status: ${json.status} - ${json.error_message || ''}`);
      return [];
    }

    return json.results || [];
  },

  /**
   * Comprehensive Hyderabad Veterinary Directory Discovery Strategy
   * Covers Hyderabad geographically across key categories and localities.
   * Deduplicates using stable Google Place IDs.
   */
  async discoverHyderabadClinics(options: GooglePlacesSearchOptions = {}): Promise<{
    clinics: IClinic[];
    isConfigured: boolean;
    source: 'google_places' | 'unconfigured';
  }> {
    if (!this.isConfigured()) {
      return {
        clinics: [],
        isConfigured: false,
        source: 'unconfigured',
      };
    }

    const cacheKey = JSON.stringify({
      lat: options.lat ? Math.round(options.lat * 100) / 100 : undefined,
      lng: options.lng ? Math.round(options.lng * 100) / 100 : undefined,
      radiusKm: options.radiusKm,
      search: options.search?.trim().toLowerCase(),
      locality: options.locality?.trim().toLowerCase(),
      emergencyOnly: options.emergencyOnly,
      openNow: options.openNow,
      minRating: options.minRating,
    });

    // Check memory cache
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return {
        clinics: cached.data,
        isConfigured: true,
        source: 'google_places',
      };
    }

    const centerLat = options.lat ?? HYDERABAD_CENTER.lat;
    const centerLng = options.lng ?? HYDERABAD_CENTER.lng;
    const radiusMeters = (options.radiusKm ?? 25) * 1000;

    // Build search queries according to user filters or broad Hyderabad discovery
    const queries: string[] = [];

    if (options.search?.trim()) {
      queries.push(`${options.search.trim()} veterinary clinic Hyderabad`);
    } else if (options.locality?.trim() && options.locality.toLowerCase() !== 'all') {
      queries.push(`veterinary clinic in ${options.locality.trim()}, Hyderabad`);
      queries.push(`animal hospital in ${options.locality.trim()}, Hyderabad`);
    } else if (options.emergencyOnly) {
      queries.push('24/7 emergency veterinary hospital in Hyderabad');
      queries.push('animal emergency clinic in Hyderabad');
    } else {
      // Broad practical coverage across Hyderabad
      queries.push('veterinary clinic in Hyderabad');
      queries.push('animal hospital in Hyderabad');
      queries.push('emergency veterinary clinic in Hyderabad');
      queries.push('pet clinic in Gachibowli Madhapur Jubilee Hills Hyderabad');
      queries.push('veterinary clinic in Secunderabad Begumpet Kukatpally');
    }

    const placesMap = new Map<string, IClinic>();

    for (const q of queries) {
      try {
        let rawPlaces: any[] = [];
        try {
          rawPlaces = await this.searchWithPlacesNew(q, centerLat, centerLng, radiusMeters);
        } catch {
          // Fallback to legacy text search if Places API New isn't activated
          rawPlaces = await this.searchWithPlacesLegacy(q, centerLat, centerLng, radiusMeters);
        }

        for (const raw of rawPlaces) {
          const clinic = raw.id ? normalizePlaceNew(raw, options.lat, options.lng) : normalizePlaceLegacy(raw, options.lat, options.lng);
          if (clinic.placeId && !placesMap.has(clinic.placeId)) {
            placesMap.set(clinic.placeId, clinic);
          }
        }
      } catch (err: any) {
        logger.warn(`Error running Places search for query "${q}": ${err.message}`);
      }
    }

    let results = Array.from(placesMap.values());

    // Apply post-filters
    if (options.locality && options.locality.toLowerCase() !== 'all') {
      const locLower = options.locality.toLowerCase();
      results = results.filter(
        (c) =>
          (c.locality && c.locality.toLowerCase().includes(locLower)) ||
          c.address.toLowerCase().includes(locLower) ||
          c.name.toLowerCase().includes(locLower)
      );
    }

    if (options.emergencyOnly) {
      results = results.filter((c) => c.emergencyAvailable === true);
    }

    if (options.openNow) {
      results = results.filter((c) => c.isOpenNow === true);
    }

    if (typeof options.minRating === 'number' && options.minRating > 0) {
      results = results.filter((c) => c.ratings.avg >= options.minRating!);
    }

    // Sort order:
    // If user coordinates provided: sort by distance ascending
    // Otherwise sort by rating descending, then count descending
    if (typeof options.lat === 'number' && typeof options.lng === 'number') {
      results.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    } else {
      results.sort((a, b) => {
        if (b.ratings.avg !== a.ratings.avg) {
          return b.ratings.avg - a.ratings.avg;
        }
        return b.ratings.count - a.ratings.count;
      });
    }

    // Save in in-memory cache
    searchCache.set(cacheKey, {
      timestamp: Date.now(),
      data: results,
    });

    return {
      clinics: results,
      isConfigured: true,
      source: 'google_places',
    };
  },

  /**
   * Fetch Place Details for a specific Google Place ID
   */
  async getPlaceDetails(placeId: string): Promise<IClinic | null> {
    if (!this.isConfigured() || !placeId) return null;

    const cached = placeDetailsCache.get(placeId);
    if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
      return cached.data;
    }

    const apiKey = env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return null;

    try {
      // Try Places API (New) Details
      const fieldMask = [
        'id',
        'displayName',
        'formattedAddress',
        'location',
        'rating',
        'userRatingCount',
        'internationalPhoneNumber',
        'nationalPhoneNumber',
        'websiteUri',
        'regularOpeningHours',
        'currentOpeningHours',
        'types',
        'googleMapsUri',
      ].join(',');

      const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': fieldMask,
        },
      });

      if (res.ok) {
        const place = (await res.json()) as any;
        const clinic = normalizePlaceNew(place);
        placeDetailsCache.set(placeId, { timestamp: Date.now(), data: clinic });
        return clinic;
      }
    } catch {
      // Fallback to legacy Place Details API
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = (await res.json()) as any;
        if (json.status === 'OK' && json.result) {
          const clinic = normalizePlaceLegacy(json.result);
          placeDetailsCache.set(placeId, { timestamp: Date.now(), data: clinic });
          return clinic;
        }
      }
    } catch (err: any) {
      logger.warn(`Failed to fetch place details for ${placeId}: ${err.message}`);
    }

    return null;
  },

  /**
   * Clear in-memory cache (useful for testing)
   */
  clearCache(): void {
    searchCache.clear();
    placeDetailsCache.clear();
  },
};
