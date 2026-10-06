import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EditPetPage from '../EditPetPage';
import { renderWithProviders } from '@/test/test-utils';
import type { IPet } from '@petverse/shared-types';

const mockPet: IPet = {
  _id: 'pet_edit_123',
  ownerId: 'owner_123',
  name: 'Kona',
  nickname: 'Konabear',
  species: 'dog',
  breed: 'Husky',
  gender: 'female',
  dob: '2020-03-10T00:00:00.000Z',
  weight: 22.0,
  microchipId: 'CHIP-987654',
  qrCode: 'QR-KONA-99',
  gallery: [],
  allergies: ['Peanuts'],
  chronicDiseases: [],
  disabilities: [],
  currentMedications: [],
  isVaccinated: true,
  isSterilized: true,
  lifestyle: 'indoor',
  activityLevel: 'high',
  behaviorNotes: 'Very energetic and loves snow',
  favoriteFood: ['Salmon'],
  favoriteToys: ['Rope'],
  isAdopted: false,
  isLost: false,
  isPublicProfile: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockUpdatePetMutateAsync = vi.fn().mockResolvedValue({ ...mockPet, name: 'Kona Updated' });
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ petId: 'pet_edit_123' }),
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/features/pets/hooks/usePets', () => ({
  usePet: () => ({
    data: mockPet,
    isLoading: false,
    error: null,
  }),
  useUpdatePet: () => ({
    mutateAsync: mockUpdatePetMutateAsync,
    isPending: false,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('EditPetPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders edit header and navigation tabs', () => {
    renderWithProviders(<EditPetPage />);

    expect(screen.getByText('Edit Kona')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /basic info/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /health & medical/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /lifestyle/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /identity & ownership/i })).toBeInTheDocument();
  });

  it('pre-populates form fields with existing pet data', async () => {
    renderWithProviders(<EditPetPage />);

    const nameInput = screen.getByDisplayValue('Kona') as HTMLInputElement;
    expect(nameInput).toBeInTheDocument();

    const nicknameInput = screen.getByDisplayValue('Konabear') as HTMLInputElement;
    expect(nicknameInput).toBeInTheDocument();

    const breedInput = screen.getByDisplayValue('Husky') as HTMLInputElement;
    expect(breedInput).toBeInTheDocument();
  });

  it('allows navigating between tabs', async () => {
    renderWithProviders(<EditPetPage />);

    const healthTab = screen.getByRole('button', { name: /health & medical/i });
    fireEvent.click(healthTab);

    expect(screen.getByRole('heading', { name: 'Health & Medical' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('22')).toBeInTheDocument(); // weight

    const lifestyleTab = screen.getByRole('button', { name: /lifestyle/i });
    fireEvent.click(lifestyleTab);

    expect(screen.getByRole('heading', { name: 'Lifestyle' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Very energetic and loves snow')).toBeInTheDocument();
  });

  it('submits updated profile and calls updatePet mutation', async () => {
    renderWithProviders(<EditPetPage />);

    const nameInput = screen.getByDisplayValue('Kona');
    fireEvent.change(nameInput, { target: { value: 'Kona Updated' } });

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdatePetMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'pet_edit_123',
          data: expect.objectContaining({
            name: 'Kona Updated',
          }),
        })
      );
    });
  });
});
