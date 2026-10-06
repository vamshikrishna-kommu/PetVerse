import {
  googlePlacesService,
  calculateDistanceKm,
  matchLocalityFromAddress,
  HYDERABAD_CENTER,
} from '../services/google-places.service';
import { nearbyService } from '../services/nearby.service';
import { ClinicModel } from '../../appointments/models/clinic.model';
import mongoose from 'mongoose';

describe('Google Places Hyderabad Veterinary Directory Discovery Tests', () => {
  beforeEach(() => {
    googlePlacesService.clearCache();
    jest.clearAllMocks();
    jest.spyOn(nearbyService, 'seedClinicsIfEmpty').mockResolvedValue();
  });

  describe('1. Geospatial Haversine Distance Calculation', () => {
    it('calculates accurate distance between Banjara Hills and Gachibowli', () => {
      // Banjara Hills: 17.4150, 78.4350
      // Gachibowli: 17.4400, 78.3650
      const dist = calculateDistanceKm(17.4150, 78.4350, 17.4400, 78.3650);
      expect(dist).toBeGreaterThan(7.0);
      expect(dist).toBeLessThan(10.0);
    });

    it('returns 0 for identical coordinates', () => {
      const dist = calculateDistanceKm(17.3850, 78.4867, 17.3850, 78.4867);
      expect(dist).toBe(0);
    });
  });

  describe('2. Hyderabad Locality Matching', () => {
    it('accurately identifies locality from real Hyderabad addresses', () => {
      expect(
        matchLocalityFromAddress('Plot 18, Near Bio-Diversity Junction, Gachibowli, Hyderabad, TS 500032')
      ).toBe('Gachibowli');

      expect(
        matchLocalityFromAddress('Road No. 10, Singada Kunta, Banjara Hills, Hyderabad, TS 500034')
      ).toBe('Banjara Hills');

      expect(
        matchLocalityFromAddress('M.G. Road, Near Clock Tower, Secunderabad, TS 500003')
      ).toBe('Secunderabad');

      expect(
        matchLocalityFromAddress('Road No. 1, KPHB Colony Phase 1, Kukatpally, Hyderabad, TS 500072')
      ).toBe('Kukatpally');
    });

    it('returns undefined when no recognized Hyderabad locality is in the address', () => {
      expect(matchLocalityFromAddress('123 Random Road, Unknown Town, 123456')).toBeUndefined();
      expect(matchLocalityFromAddress('')).toBeUndefined();
    });
  });

  describe('3. Discovery, Deduplication & Caching Strategy', () => {
    it('handles unconfigured API key gracefully without crashing', async () => {
      jest.spyOn(googlePlacesService, 'isConfigured').mockReturnValue(false);

      const result = await googlePlacesService.discoverHyderabadClinics();
      expect(result.isConfigured).toBe(false);
      expect(result.source).toBe('unconfigured');
      expect(result.clinics).toEqual([]);
    });

    it('deduplicates clinics by Google Place ID across multiple category searches', async () => {
      jest.spyOn(googlePlacesService, 'isConfigured').mockReturnValue(true);

      const mockPlaceA = {
        id: 'ChIJ_duplicate_123',
        displayName: { text: 'Hyderabad Pet Care Hospital' },
        formattedAddress: 'Road No. 36, Jubilee Hills, Hyderabad',
        location: { latitude: 17.432, longitude: 78.406 },
        rating: 4.8,
        userRatingCount: 310,
        types: ['veterinary_care', 'hospital'],
      };

      const mockPlaceB = {
        id: 'ChIJ_unique_456',
        displayName: { text: 'Secunderabad Animal Clinic' },
        formattedAddress: 'Clock Tower, Secunderabad',
        location: { latitude: 17.439, longitude: 78.498 },
        rating: 4.6,
        userRatingCount: 150,
        types: ['veterinary_care'],
      };

      // Simulate multiple search queries returning the same place ID
      jest
        .spyOn(googlePlacesService, 'searchWithPlacesNew')
        .mockResolvedValueOnce([mockPlaceA, mockPlaceB])
        .mockResolvedValueOnce([mockPlaceA]); // Duplicate

      const result = await googlePlacesService.discoverHyderabadClinics();

      expect(result.isConfigured).toBe(true);
      expect(result.clinics.length).toBe(2);
      expect(result.clinics.map((c) => c.placeId)).toEqual([
        'ChIJ_duplicate_123',
        'ChIJ_unique_456',
      ]);
    });

    it('caches search results in memory and does not make redundant API calls within TTL', async () => {
      jest.spyOn(googlePlacesService, 'isConfigured').mockReturnValue(true);

      const searchSpy = jest
        .spyOn(googlePlacesService, 'searchWithPlacesNew')
        .mockResolvedValue([
          {
            id: 'ChIJ_cached_999',
            displayName: { text: 'Olive Pet Hospital' },
            formattedAddress: 'Banjara Hills, Hyderabad',
            location: { latitude: 17.415, longitude: 78.435 },
            rating: 4.9,
            userRatingCount: 480,
            types: ['veterinary_care'],
          },
        ]);

      // Call 1
      const res1 = await googlePlacesService.discoverHyderabadClinics({ locality: 'Banjara Hills' });
      expect(res1.clinics.length).toBe(1);
      const callCountAfterFirst = searchSpy.mock.calls.length;

      // Call 2 with identical options should be served from cache
      const res2 = await googlePlacesService.discoverHyderabadClinics({ locality: 'Banjara Hills' });
      expect(res2.clinics.length).toBe(1);
      expect(searchSpy.mock.calls.length).toBe(callCountAfterFirst); // No new calls
    });
  });

  describe('4. Nearby Service Integration', () => {
    it('returns empty array in production environment when database has no clinics', async () => {
      const origEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      jest.spyOn(ClinicModel, 'find').mockReturnValue({
        sort: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([]) }) }) }),
      } as any);

      jest.spyOn(googlePlacesService, 'isConfigured').mockReturnValue(false);

      const result = await nearbyService.getNearbyServices({ search: 'NonExistent' });
      expect(result.data.length).toBe(0);

      process.env.NODE_ENV = origEnv;
    });

    it('calculates distance from user GPS coordinates and sorts ascending', async () => {
      jest.spyOn(ClinicModel, 'aggregate').mockReturnValue({
        exec: () => Promise.resolve([]),
      } as any);

      jest.spyOn(googlePlacesService, 'isConfigured').mockReturnValue(true);
      jest.spyOn(googlePlacesService, 'discoverHyderabadClinics').mockResolvedValue({
        isConfigured: true,
        source: 'google_places',
        clinics: [
          {
            _id: 'c1',
            placeId: 'c1',
            name: 'Far Clinic',
            address: 'Secunderabad',
            location: { type: 'Point', coordinates: [78.50, 17.44] },
            services: [],
            photos: [],
            ratings: { avg: 4.5, count: 10 },
            isVerified: true,
            googleMapsUri: '',
            distanceKm: 12.5,
          },
          {
            _id: 'c2',
            placeId: 'c2',
            name: 'Close Clinic',
            address: 'Jubilee Hills',
            location: { type: 'Point', coordinates: [78.41, 17.43] },
            services: [],
            photos: [],
            ratings: { avg: 4.8, count: 50 },
            isVerified: true,
            googleMapsUri: '',
            distanceKm: 2.1,
          },
        ],
      });

      const userCoords = { lat: 17.42, lng: 78.41 };
      const result = await nearbyService.getNearbyServices(userCoords);

      expect(result.data.length).toBe(2);
      expect(result.data[0].name).toBe('Close Clinic');
      expect(result.data[1].name).toBe('Far Clinic');
    });

    it('filters emergency hospitals when emergencyOnly flag is set', async () => {
      jest.spyOn(ClinicModel, 'find').mockReturnValue({
        sort: () => ({ limit: () => ({ lean: () => ({ exec: () => Promise.resolve([]) }) }) }),
      } as any);

      jest.spyOn(googlePlacesService, 'isConfigured').mockReturnValue(true);
      jest.spyOn(googlePlacesService, 'discoverHyderabadClinics').mockResolvedValue({
        isConfigured: true,
        source: 'google_places',
        clinics: [
          {
            _id: 'c1',
            placeId: 'c1',
            name: 'Standard Clinic',
            address: 'Madhapur',
            location: { type: 'Point', coordinates: [78.39, 17.44] },
            services: [],
            photos: [],
            ratings: { avg: 4.5, count: 10 },
            isVerified: true,
            emergencyAvailable: false,
            googleMapsUri: '',
          },
          {
            _id: 'c2',
            placeId: 'c2',
            name: '24/7 Super Vets Emergency Hospital',
            address: 'Gachibowli',
            location: { type: 'Point', coordinates: [78.36, 17.44] },
            services: [],
            photos: [],
            ratings: { avg: 4.9, count: 100 },
            isVerified: true,
            emergencyAvailable: true,
            googleMapsUri: '',
          },
        ],
      });

      const result = await nearbyService.getNearbyServices({ emergencyOnly: true });

      expect(result.data.length).toBe(1);
      expect(result.data[0].name).toContain('24/7 Super Vets');
    });
  });
});
