import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LostFoundPage from '../LostFoundPage';
import { renderWithProviders } from '@/test/test-utils';
import type { ILostFoundReport } from '../../api/lostFoundApi';

const mockReports: ILostFoundReport[] = [
  {
    _id: 'report_1',
    reporterId: 'reporter_99',
    reporterName: 'John Doe',
    contactMethod: 'in_app',
    type: 'lost',
    petName: 'Milo',
    species: 'dog',
    breed: 'Beagle',
    color: 'Tri-color',
    gender: 'male',
    description: 'Very friendly, responds to whistle. Last seen near Oak Park.',
    location: {
      address: 'Oak Park, Central Ave',
      coordinates: [-122.4194, 37.7749],
    },
    eventDate: new Date().toISOString(),
    status: 'active',
    moderationStatus: 'approved',
    photos: ['https://images.unsplash.com/photo-1.jpg'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

vi.mock('../../../pets/hooks/usePets', () => ({
  usePets: () => ({
    data: { data: [] },
  }),
}));

vi.mock('../../hooks/useLostFound', () => ({
  useLostFoundReports: vi.fn(),
  useCreateLostFoundReport: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useSendLostFoundInquiry: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useResolveLostFoundReport: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useLostFoundMatches: () => ({
    data: [],
    isLoading: false,
  }),
}));

import { useLostFoundReports } from '../../hooks/useLostFound';

describe('LostFoundPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when there are no active lost pet reports', () => {
    vi.mocked(useLostFoundReports).mockReturnValue({
      data: { data: [] },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    renderWithProviders(<LostFoundPage />);

    expect(screen.getByText(/no active lost pet alerts/i)).toBeInTheDocument();
  });

  it('renders lost pet alert cards when pets are reported missing', () => {
    vi.mocked(useLostFoundReports).mockReturnValue({
      data: { data: mockReports },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    renderWithProviders(<LostFoundPage />);

    expect(screen.getByText('Milo')).toBeInTheDocument();
    expect(screen.getByText(/Beagle/i)).toBeInTheDocument();
    expect(screen.getByText(/Very friendly, responds to whistle/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /contact/i })).toBeInTheDocument();
  });

  it('opens contact modal when Contact is clicked', () => {
    vi.mocked(useLostFoundReports).mockReturnValue({
      data: { data: mockReports },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as any);

    renderWithProviders(<LostFoundPage />);

    const contactBtn = screen.getByRole('button', { name: /contact/i });
    fireEvent.click(contactBtn);

    // Modal title & subtitle with pet name
    expect(screen.getByText(/send secure inquiry to reporter/i)).toBeInTheDocument();
    expect(screen.getByText(/regarding lost pet "milo"/i)).toBeInTheDocument();
  });
});
