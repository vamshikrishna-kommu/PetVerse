import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import PetQRPage from '../PetQRPage';
import { renderWithProviders } from '@/test/test-utils';
import type { IPet } from '@petverse/shared-types';

// Sample Pet 1: Dog with photo
const mockDogWithPhoto: IPet = {
  _id: 'pet_dog_1',
  ownerId: 'owner_100',
  name: 'Cooper',
  species: 'dog',
  breed: 'Golden Retriever',
  gender: 'male',
  dob: '2021-06-15',
  weight: 31.5,
  color: 'Golden Honey',
  microchipId: 'CHIP-981020001',
  qrCode: 'QR-COOPER-991',
  avatar: 'https://images.unsplash.com/photo-dog.jpg',
  gallery: [],
  allergies: ['Peanuts', 'Beef'],
  chronicDiseases: [],
  disabilities: [],
  currentMedications: ['Apoquel 16mg'],
  isVaccinated: true,
  isSterilized: true,
  lifestyle: 'outdoor',
  activityLevel: 'high',
  favoriteFood: ['Chicken kibble'],
  favoriteToys: ['Tennis ball'],
  isAdopted: false,
  isLost: false,
  isPublicProfile: true,
  createdAt: '2022-01-01T00:00:00.000Z',
  updatedAt: '2022-01-01T00:00:00.000Z',
};

// Sample Pet 2: Cat with photo
const mockCatWithPhoto: IPet = {
  _id: 'pet_cat_2',
  ownerId: 'owner_101',
  name: 'Mochi',
  species: 'cat',
  breed: 'Scottish Fold',
  gender: 'female',
  dob: '2022-04-10',
  weight: 4.2,
  color: 'Silver Tabby',
  microchipId: 'CHIP-981020002',
  qrCode: 'QR-MOCHI-882',
  avatar: 'https://images.unsplash.com/photo-cat.jpg',
  gallery: [],
  allergies: [],
  chronicDiseases: [],
  disabilities: [],
  currentMedications: [],
  isVaccinated: true,
  isSterilized: true,
  lifestyle: 'indoor',
  activityLevel: 'moderate',
  favoriteFood: ['Salmon'],
  favoriteToys: ['Feather wand'],
  isAdopted: false,
  isLost: false,
  isPublicProfile: true,
  createdAt: '2022-01-01T00:00:00.000Z',
  updatedAt: '2022-01-01T00:00:00.000Z',
};

// Sample Pet 3: Pet without photo
const mockPetNoPhoto: IPet = {
  _id: 'pet_no_photo_3',
  ownerId: 'owner_102',
  name: 'Barnaby',
  species: 'rabbit',
  breed: 'Holland Lop',
  gender: 'male',
  dob: '2023-01-01',
  weight: 1.8,
  microchipId: 'CHIP-981020003',
  qrCode: 'QR-BARNABY-773',
  avatar: undefined,
  gallery: [],
  allergies: [],
  chronicDiseases: [],
  disabilities: [],
  currentMedications: [],
  isVaccinated: false,
  isSterilized: false,
  lifestyle: 'indoor',
  activityLevel: 'moderate',
  favoriteFood: [],
  favoriteToys: [],
  isAdopted: false,
  isLost: false,
  isPublicProfile: true,
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
};

// Sample Pet 4: Long name and long breed
const mockPetLongData: IPet = {
  _id: 'pet_long_4',
  ownerId: 'owner_103',
  name: 'Sir Bartholomew Maximillian Fluffington The Third',
  species: 'dog',
  breed: 'Nova Scotia Duck Tolling Retriever & Welsh Corgi Mix',
  gender: 'male',
  dob: '2020-02-14',
  weight: 24.0,
  microchipId: 'CHIP-999888777666',
  qrCode: 'QR-BARTHOLOMEW-664',
  gallery: [],
  allergies: [],
  chronicDiseases: [],
  disabilities: [],
  currentMedications: [],
  isVaccinated: true,
  isSterilized: true,
  lifestyle: 'outdoor',
  activityLevel: 'high',
  favoriteFood: [],
  favoriteToys: [],
  isAdopted: false,
  isLost: false,
  isPublicProfile: true,
  createdAt: '2020-02-14T00:00:00.000Z',
  updatedAt: '2020-02-14T00:00:00.000Z',
};

// Sample Pet 5: Missing optional information
const mockPetMissingOptional: IPet = {
  _id: 'pet_minimal_5',
  ownerId: 'owner_104',
  name: 'Pip',
  species: 'bird',
  gender: 'unknown',
  qrCode: 'QR-PIP-555',
  gallery: [],
  allergies: [],
  chronicDiseases: [],
  disabilities: [],
  currentMedications: [],
  isVaccinated: false,
  isSterilized: false,
  lifestyle: 'indoor',
  activityLevel: 'low',
  favoriteFood: [],
  favoriteToys: [],
  isAdopted: false,
  isLost: false,
  isPublicProfile: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

// Sample Pet 6: Reported Lost Pet
const mockLostPet: IPet = {
  _id: 'pet_lost_6',
  ownerId: 'owner_105',
  name: 'Shadow',
  species: 'cat',
  breed: 'Domestic Shorthair',
  gender: 'male',
  dob: '2021-08-10',
  qrCode: 'QR-SHADOW-LOST-006',
  avatar: 'https://images.unsplash.com/photo-shadow.jpg',
  gallery: [],
  allergies: [],
  chronicDiseases: [],
  disabilities: [],
  currentMedications: [],
  isVaccinated: true,
  isSterilized: true,
  lifestyle: 'indoor',
  activityLevel: 'moderate',
  favoriteFood: [],
  favoriteToys: [],
  isAdopted: false,
  isLost: true, // LOST
  isPublicProfile: true,
  createdAt: '2021-08-10T00:00:00.000Z',
  updatedAt: '2021-08-10T00:00:00.000Z',
};

let currentMockPet: IPet | null = mockDogWithPhoto;

vi.mock('@/features/pets/hooks/usePets', () => ({
  usePet: () => ({
    data: currentMockPet,
    isLoading: false,
    error: null,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ petId: currentMockPet?._id || 'pet_dog_1' }),
  };
});

describe('PetQRPage Component & Printing System', () => {
  beforeEach(() => {
    currentMockPet = mockDogWithPhoto;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders Dog with photo, breed, microchip, and medical alerts', async () => {
    currentMockPet = mockDogWithPhoto;
    renderWithProviders(<PetQRPage />);

    // Header & identity
    expect(screen.getByText("Cooper's Identity Tag")).toBeInTheDocument();
    expect(screen.getAllByText(/Golden Retriever/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/CHIP-981020001/i)[0]).toBeInTheDocument();

    // Photo check
    const photoImg = screen.getByAltText('Cooper photo');
    expect(photoImg).toHaveAttribute('src', mockDogWithPhoto.avatar);

    // Medical alerts check
    expect(screen.getByText(/Peanuts, Beef/i)).toBeInTheDocument();
    expect(screen.getByText(/Apoquel 16mg/i)).toBeInTheDocument();

    // Instructions and footer
    expect(screen.getByText(/IF FOUND, PLEASE SCAN/i)).toBeInTheDocument();
    expect(screen.getByText(/Helping pets find their way home/i)).toBeInTheDocument();

    // Verify QR code is generated and ready
    await waitFor(() => {
      const qrImg = screen.getByAltText('Cooper Safety QR Code');
      expect(qrImg).toHaveAttribute('src', expect.stringContaining('data:image/png;base64'));
    });
  });

  it('renders Cat with photo and generates distinct QR code destination', async () => {
    currentMockPet = mockCatWithPhoto;
    renderWithProviders(<PetQRPage />);

    expect(screen.getByText("Mochi's Identity Tag")).toBeInTheDocument();
    expect(screen.getAllByText(/Scottish Fold/i)[0]).toBeInTheDocument();
    expect(screen.getAllByText(/CHIP-981020002/i)[0]).toBeInTheDocument();

    const catPhoto = screen.getByAltText('Mochi photo');
    expect(catPhoto).toHaveAttribute('src', mockCatWithPhoto.avatar);

    await waitFor(() => {
      const qrImg = screen.getByAltText('Mochi Safety QR Code');
      expect(qrImg).toBeInTheDocument();
    });
  });

  it('renders graceful fallback badge when pet has no avatar', async () => {
    currentMockPet = mockPetNoPhoto;
    renderWithProviders(<PetQRPage />);

    expect(screen.getByText("Barnaby's Identity Tag")).toBeInTheDocument();
    expect(screen.getAllByText(/Holland Lop/i)[0]).toBeInTheDocument();

    // No broken image icon should be rendered; fallback badge displays species
    expect(screen.queryByAltText('Barnaby photo')).not.toBeInTheDocument();
    expect(screen.getAllByText(/rabbit/i).length).toBeGreaterThan(0);
  });

  it('renders pet with long name and long breed without errors', async () => {
    currentMockPet = mockPetLongData;
    renderWithProviders(<PetQRPage />);

    expect(
      screen.getByText("Sir Bartholomew Maximillian Fluffington The Third's Identity Tag")
    ).toBeInTheDocument();
    expect(
      screen.getAllByText(/Nova Scotia Duck Tolling Retriever/i)[0]
    ).toBeInTheDocument();
  });

  it('renders pet with missing optional information (no microchip, weight, or breed)', async () => {
    currentMockPet = mockPetMissingOptional;
    renderWithProviders(<PetQRPage />);

    expect(screen.getByText("Pip's Identity Tag")).toBeInTheDocument();
    expect(screen.getAllByText(/bird/i).length).toBeGreaterThan(0);
  });

  it('displays urgent warning banner when pet is reported lost', async () => {
    currentMockPet = mockLostPet;
    renderWithProviders(<PetQRPage />);

    expect(screen.getByText(/LOST PET REPORTED/i)).toBeInTheDocument();
    expect(screen.getByText(/Please scan immediately to reunite with family!/i)).toBeInTheDocument();
  });

  it('switches between Smart Collar Tag, Veterinary Wallet ID, and A4 Multi-Tag Sheet formats', async () => {
    currentMockPet = mockDogWithPhoto;
    renderWithProviders(<PetQRPage />);

    // Default format is collar tag
    expect(screen.getByText(/✂ Punch Hole for Ring/i)).toBeInTheDocument();

    // Switch to Veterinary Wallet ID
    const walletTab = screen.getByRole('button', { name: /Veterinary Wallet ID/i });
    fireEvent.click(walletTab);

    expect(screen.getByText(/PETVERSE VETERINARY ID/i)).toBeInTheDocument();
    expect(screen.getByText(/REGISTERED MEMBER/i)).toBeInTheDocument();

    // Switch to A4 Multi-Tag Sheet
    const sheetTab = screen.getByRole('button', { name: /A4 Multi-Tag Sheet/i });
    fireEvent.click(sheetTab);

    expect(
      screen.getByText(/PETVERSE • OFFICIAL PRINTABLE IDENTIFICATION SHEET/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Cutout 1: Collar Tag/i)).toBeInTheDocument();
    expect(screen.getByText(/Cutout 2: Wallet Card/i)).toBeInTheDocument();
  });

  it('triggers browser window.print() when Print QR Tag is clicked', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    currentMockPet = mockDogWithPhoto;
    renderWithProviders(<PetQRPage />);

    // Wait until QR is ready so print button is enabled
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Print Pet QR Tag/i })).not.toBeDisabled();
    });

    const printButton = screen.getByRole('button', { name: /Print Pet QR Tag/i });
    fireEvent.click(printButton);

    expect(printSpy).toHaveBeenCalledTimes(1);
  });

  it('copies the public profile link to clipboard', async () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextSpy,
      },
    });

    currentMockPet = mockDogWithPhoto;
    renderWithProviders(<PetQRPage />);

    const copyBtn = screen.getByRole('button', { name: /Copy public safety link/i });
    fireEvent.click(copyBtn);

    expect(writeTextSpy).toHaveBeenCalledWith(
      expect.stringContaining('/public/pet/QR-COOPER-991')
    );
  });
});
