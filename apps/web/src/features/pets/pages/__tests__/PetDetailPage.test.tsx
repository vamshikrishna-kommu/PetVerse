import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PetDetailPage from '../PetDetailPage';
import { renderWithProviders } from '@/test/test-utils';
import type { IPet } from '@petverse/shared-types';

const mockPet: IPet = {
  _id: 'pet_detail_99',
  ownerId: 'owner_123',
  name: 'Kona',
  species: 'dog',
  breed: 'Husky',
  gender: 'female',
  dob: '2020-03-10',
  weight: 22.0,
  microchipId: 'CHIP-987654',
  qrCode: 'QR-KONA-99',
  gallery: ['https://images.unsplash.com/photo-1.jpg'],
  allergies: [],
  chronicDiseases: [],
  disabilities: [],
  currentMedications: [],
  isVaccinated: true,
  isSterilized: true,
  lifestyle: 'mixed',
  activityLevel: 'high',
  favoriteFood: [],
  favoriteToys: [],
  isAdopted: false,
  isLost: false,
  isPublicProfile: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockDeletePetMutate = vi.fn();
const mockUpdatePetMutate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ petId: 'pet_detail_99' }),
  };
});

vi.mock('@/features/pets/hooks/usePets', () => ({
  usePet: () => ({
    data: mockPet,
    isLoading: false,
    error: null,
  }),
  usePetTimeline: () => ({
    data: [],
    isLoading: false,
  }),
  useDeletePet: () => ({
    mutate: mockDeletePetMutate,
    isPending: false,
  }),
  useUpdatePet: () => ({
    mutate: mockUpdatePetMutate,
    isPending: false,
  }),
  useUploadGallery: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useRemoveGalleryImage: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
  useSetPrimaryGalleryImage: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

vi.mock('@/features/health/hooks/useHealth', () => ({
  useHealthDashboard: () => ({
    data: {
      healthScore: 92,
      activeConditions: [],
      allergies: [],
      latestVitals: { weight: 22.0 },
    },
    isLoading: false,
  }),
}));

describe('PetDetailPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders pet profile header with name, breed, and microchip', () => {
    renderWithProviders(<PetDetailPage />);

    expect(screen.getByText('Kona')).toBeInTheDocument();
    expect(screen.getByText(/Husky dog/i)).toBeInTheDocument();
    expect(screen.getByText(/CHIP-987654/)).toBeInTheDocument();
  });

  it('renders Overview, Timeline, and Gallery tabs and allows switching', () => {
    renderWithProviders(<PetDetailPage />);

    const overviewTab = screen.getByRole('button', { name: /overview/i });
    const galleryTab = screen.getByRole('button', { name: /gallery/i });

    expect(overviewTab).toBeInTheDocument();
    expect(galleryTab).toBeInTheDocument();

    // Click Gallery tab
    fireEvent.click(galleryTab);
    expect(screen.getByText(/photo gallery/i)).toBeInTheDocument();
  });

  it('renders link to QR tag safety profile', () => {
    renderWithProviders(<PetDetailPage />);

    const qrLink = screen.getByRole('link', { name: /qr tag/i });
    expect(qrLink).toHaveAttribute('href', '/pets/pet_detail_99/qr');
  });

  it('triggers emergency lost toggle when reporting pet lost', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderWithProviders(<PetDetailPage />);

    const reportLostBtn = screen.getByRole('button', { name: /report lost/i });
    fireEvent.click(reportLostBtn);

    expect(mockUpdatePetMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'pet_detail_99',
        data: { isLost: true },
      }),
      expect.anything()
    );
  });
});
