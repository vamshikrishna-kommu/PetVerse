import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NearbyPage from '../NearbyPage';
import { renderWithProviders } from '@/test/test-utils';
import type { IClinic } from '@petverse/shared-types';

const mockClinics: IClinic[] = [
  {
    _id: 'place_olive_hospital',
    placeId: 'place_olive_hospital',
    name: 'Olive Pet Hospital & 24/7 Emergency Care',
    address: 'Road No. 10, Singada Kunta, Banjara Hills, Hyderabad, TS 500034',
    locality: 'Banjara Hills',
    type: 'emergency_hospital',
    location: { type: 'Point', coordinates: [78.435, 17.415] },
    phone: '+91 40 2335 1199',
    website: 'https://olivepethospital.com',
    services: ['24/7 ICU & Critical Care', 'Digital X-Ray', 'Emergency Oxygen'],
    ratings: { avg: 4.9, count: 480 },
    isVerified: true,
    emergencyAvailable: true,
    isOpenNow: true,
    googleMapsUri: 'https://maps.google.com/?cid=123',
    source: 'google_places',
    distanceKm: 2.5,
    photos: [],
  },
  {
    _id: 'place_super_vets',
    placeId: 'place_super_vets',
    name: 'Super Vets 24/7 Multi-Specialty Pet Hospital',
    address: 'Plot 18, Near Bio-Diversity Junction, Gachibowli, Hyderabad, TS 500032',
    locality: 'Gachibowli',
    type: 'emergency_hospital',
    location: { type: 'Point', coordinates: [78.365, 17.44] },
    phone: '+91 40 4855 7799',
    website: 'https://supervets.in',
    services: ['24/7 Trauma Care', 'Laparoscopic Surgery'],
    ratings: { avg: 4.8, count: 395 },
    isVerified: true,
    emergencyAvailable: true,
    isOpenNow: true,
    googleMapsUri: 'https://maps.google.com/?cid=456',
    source: 'google_places',
    distanceKm: 7.8,
    photos: [],
  },
  {
    _id: 'place_dr_dog',
    placeId: 'place_dr_dog',
    name: 'Dr. Dog Veterinary Clinic & Surgical Centre',
    address: 'Plot 12, Kavuri Hills, Madhapur, Hitec City, Hyderabad, TS 500081',
    locality: 'Madhapur',
    type: 'veterinary_clinic',
    location: { type: 'Point', coordinates: [78.391, 17.448] },
    phone: '+91 40 4012 3344',
    services: ['Routine Consultations', 'Preventive Vaccinations'],
    ratings: { avg: 4.7, count: 245 },
    isVerified: true,
    emergencyAvailable: false,
    isOpenNow: false,
    googleMapsUri: 'https://maps.google.com/?cid=789',
    source: 'google_places',
    distanceKm: 5.2,
    photos: [],
  },
];

vi.mock('../../hooks/useNearby', () => ({
  useNearbyServices: (params: any) => ({
    data: mockClinics.filter((c) => {
      if (params?.emergencyOnly && !c.emergencyAvailable) return false;
      if (params?.openNow && !c.isOpenNow) return false;
      if (params?.locality && !c.address.toLowerCase().includes(params.locality.toLowerCase()))
        return false;
      return true;
    }),
    isLoading: false,
    isError: false,
  }),
}));

vi.mock('@/shared/lib/googleMapsLoader', () => ({
  isGoogleMapsConfigured: () => false, // test fallback map rendering
  loadGoogleMaps: () => Promise.reject(new Error('Test mode: no Google Maps SDK')),
}));

describe('NearbyPage - Hyderabad Veterinary Directory Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders directory title, Google Places badge, and neighborhood filter pills', () => {
    renderWithProviders(<NearbyPage />);

    expect(screen.getByText('Hyderabad Veterinary Directory')).toBeInTheDocument();
    expect(screen.getByText('Powered by Google Places')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All Hyderabad' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gachibowli' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Banjara Hills' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Jubilee Hills' })).toBeInTheDocument();
  });

  it('displays veterinary clinics with verified badges, ratings, and directions action', () => {
    renderWithProviders(<NearbyPage />);

    expect(screen.getByText(/Olive Pet Hospital & 24\/7 Emergency Care/i)).toBeInTheDocument();
    expect(screen.getByText(/Super Vets 24\/7 Multi-Specialty Pet Hospital/i)).toBeInTheDocument();
    expect(screen.getByText(/Dr. Dog Veterinary Clinic/i)).toBeInTheDocument();

    // Check emergency badge
    const emergencyBadges = screen.getAllByText(/24\/7 Emergency/i);
    expect(emergencyBadges.length).toBeGreaterThan(0);

    // Check directions buttons
    const directionButtons = screen.getAllByRole('link', { name: /directions/i });
    expect(directionButtons.length).toBe(3);
  });

  it('filters clinics when emergency only filter is clicked', async () => {
    renderWithProviders(<NearbyPage />);

    const emergencyFilterBtn = screen.getByRole('button', { name: /24\/7 Emergency Care/i });
    fireEvent.click(emergencyFilterBtn);

    await waitFor(() => {
      expect(screen.getByText(/Olive Pet Hospital/i)).toBeInTheDocument();
      expect(screen.getByText(/Super Vets/i)).toBeInTheDocument();
      expect(screen.queryByText(/Dr. Dog Veterinary Clinic/i)).not.toBeInTheDocument();
    });
  });

  it('allows selecting a clinic to highlight it on map and list', async () => {
    renderWithProviders(<NearbyPage />);

    const oliveClinicCard = screen.getByText(/Olive Pet Hospital & 24\/7 Emergency Care/i).closest('.card')!;
    fireEvent.click(oliveClinicCard);

    expect(screen.getByText('Clear Selected Clinic')).toBeInTheDocument();

    // Clicking clear resets selection
    fireEvent.click(screen.getByText('Clear Selected Clinic'));
    expect(screen.queryByText('Clear Selected Clinic')).not.toBeInTheDocument();
  });

  it('renders locality filter and updates search query', async () => {
    renderWithProviders(<NearbyPage />);

    const gachibowliBtn = screen.getByRole('button', { name: 'Gachibowli' });
    fireEvent.click(gachibowliBtn);

    await waitFor(() => {
      expect(screen.getByText(/Super Vets/i)).toBeInTheDocument();
    });
  });
});
