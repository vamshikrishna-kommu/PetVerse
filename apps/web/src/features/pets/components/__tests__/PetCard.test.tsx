import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { PetCard } from '../PetCard';
import type { IPet } from '@petverse/shared-types';

const mockPet: IPet = {
  _id: 'pet_test_123',
  ownerId: 'owner_123',
  name: 'Barnaby',
  species: 'dog',
  breed: 'Golden Retriever',
  gender: 'male',
  dob: '2021-06-15',
  weight: 28.5,
  qrCode: 'QR_BARNABY_123',
  gallery: [],
  allergies: [],
  chronicDiseases: [],
  disabilities: [],
  currentMedications: [],
  isVaccinated: true,
  isSterilized: true,
  lifestyle: 'mixed',
  activityLevel: 'moderate',
  favoriteFood: [],
  favoriteToys: [],
  isAdopted: false,
  isLost: false,
  isPublicProfile: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('PetCard Component', () => {
  it('renders pet name, breed, and weight accurately', () => {
    render(
      <BrowserRouter>
        <PetCard pet={mockPet} />
      </BrowserRouter>
    );

    expect(screen.getByText('Barnaby')).toBeInTheDocument();
    expect(screen.getByText('Golden Retriever')).toBeInTheDocument();
    expect(screen.getByText('28.5 kg')).toBeInTheDocument();
  });

  it('renders default icon when no avatar is set', () => {
    const { container } = render(
      <BrowserRouter>
        <PetCard pet={mockPet} />
      </BrowserRouter>
    );

    expect(screen.queryByRole('img')).toBeNull();
    // Default paw print icon is rendered
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('renders avatar image when avatar URL is provided', () => {
    const petWithAvatar = {
      ...mockPet,
      avatar: 'https://images.unsplash.com/photo-test-dog.jpg',
    };

    render(
      <BrowserRouter>
        <PetCard pet={petWithAvatar} />
      </BrowserRouter>
    );

    const img = screen.getByRole('img', { name: 'Barnaby' });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', petWithAvatar.avatar);
  });

  it('fires onEdit callback with pet ID when edit button clicked', () => {
    const onEdit = vi.fn();
    render(
      <BrowserRouter>
        <PetCard pet={mockPet} onEdit={onEdit} />
      </BrowserRouter>
    );

    const editButtons = screen.getAllByRole('button');
    // First button is edit
    fireEvent.click(editButtons[0]);
    expect(onEdit).toHaveBeenCalledWith('pet_test_123');
  });

  it('fires onDelete callback with pet ID when delete button clicked', () => {
    const onDelete = vi.fn();
    render(
      <BrowserRouter>
        <PetCard pet={mockPet} onDelete={onDelete} />
      </BrowserRouter>
    );

    const deleteButtons = screen.getAllByRole('button');
    fireEvent.click(deleteButtons[0]);
    expect(onDelete).toHaveBeenCalledWith('pet_test_123');
  });
});
