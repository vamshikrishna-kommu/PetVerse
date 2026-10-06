import {
  osmPlacesService,
  calculateDistanceKm,
  matchLocalityFromAddress,
  VERIFIED_HYDERABAD_CLINICS,
  HYDERABAD_LOCALITIES,
} from '../services/osm-places.service';

describe('100% Free OpenStreetMap & Overpass Hyderabad Veterinary Discovery', () => {
  it('1. calculates geodesic distance correctly with Haversine formula', () => {
    // Distance from Gachibowli [17.4428, 78.3615] to Banjara Hills [17.4156, 78.4358] is ~8.4 km
    const dist = calculateDistanceKm(17.4428, 78.3615, 17.4156, 78.4358);
    expect(dist).toBeGreaterThan(7.0);
    expect(dist).toBeLessThan(10.5);
  });

  it('2. matches Hyderabad localities correctly from address strings', () => {
    expect(matchLocalityFromAddress('Road No 36, Jubilee Hills Checkpost, Hyderabad')).toBe('Jubilee Hills');
    expect(matchLocalityFromAddress('Gachibowli Main Rd, Near Telecom Nagar')).toBe('Gachibowli');
    expect(matchLocalityFromAddress('Kavuri Hills, Madhapur, TS 500081')).toBe('Madhapur');
    expect(matchLocalityFromAddress('Medchal Rd, Kompally, Hyderabad')).toBe('Kompally');
  });

  it('3. baseline verified clinics covers major Hyderabad localities at zero cost', () => {
    expect(VERIFIED_HYDERABAD_CLINICS.length).toBeGreaterThanOrEqual(15);

    // Verify key neighborhoods are covered
    const localitiesRepresented = new Set(
      VERIFIED_HYDERABAD_CLINICS.map((c) => c.locality).filter(Boolean)
    );

    expect(localitiesRepresented.has('Gachibowli')).toBe(true);
    expect(localitiesRepresented.has('Banjara Hills')).toBe(true);
    expect(localitiesRepresented.has('Jubilee Hills')).toBe(true);
    expect(localitiesRepresented.has('Madhapur')).toBe(true);
    expect(localitiesRepresented.has('Secunderabad')).toBe(true);
    expect(localitiesRepresented.has('Kukatpally')).toBe(true);
  });

  it('4. discovers clinics with locality filter without calling any paid APIs', async () => {
    const result = await osmPlacesService.discoverHyderabadClinics({
      locality: 'Banjara Hills',
    });

    expect(result.clinics.length).toBeGreaterThan(0);
    for (const clinic of result.clinics) {
      const match =
        clinic.locality?.toLowerCase().includes('banjara') ||
        clinic.address.toLowerCase().includes('banjara') ||
        clinic.name.toLowerCase().includes('banjara');
      expect(match).toBe(true);
      expect(clinic.source).toBe('openstreetmap');
    }
  });

  it('5. filters 24/7 emergency care clinics correctly', async () => {
    const result = await osmPlacesService.discoverHyderabadClinics({
      emergencyOnly: true,
    });

    expect(result.clinics.length).toBeGreaterThan(0);
    for (const clinic of result.clinics) {
      expect(clinic.emergencyAvailable).toBe(true);
    }
  });

  it('6. calculates distance and sorts by proximity when user coordinates are provided', async () => {
    // User at Gachibowli coordinates
    const result = await osmPlacesService.discoverHyderabadClinics({
      lat: 17.44,
      lng: 78.36,
    });

    expect(result.clinics.length).toBeGreaterThan(0);
    // Nearest should have distanceKm populated and <= 2km
    expect(result.clinics[0].distanceKm).toBeDefined();
    expect(result.clinics[0].distanceKm).toBeLessThan(3.0);

    // Distances should be in ascending order
    for (let i = 1; i < result.clinics.length; i++) {
      expect(result.clinics[i].distanceKm!).toBeGreaterThanOrEqual(result.clinics[i - 1].distanceKm!);
    }
  });

  it('7. resolves clinic details by OSM ID', async () => {
    const clinic = await osmPlacesService.getClinicById('osm:hyd:001');
    expect(clinic).toBeDefined();
    expect(clinic?.name).toContain('Government Veterinary Hospital');
    expect(clinic?.emergencyAvailable).toBe(true);
    expect(clinic?.googleMapsUri).toContain('https://www.google.com/maps/dir/?api=1');
  });

  it('8. search filter finds clinics by keyword', async () => {
    const result = await osmPlacesService.discoverHyderabadClinics({
      search: 'Cessna',
    });

    expect(result.clinics.length).toBeGreaterThanOrEqual(1);
    expect(result.clinics[0].name).toContain('Cessna');
  });
});
