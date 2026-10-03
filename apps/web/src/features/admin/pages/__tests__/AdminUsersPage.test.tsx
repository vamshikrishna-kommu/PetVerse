import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminUsersPage from '../AdminUsersPage';
import { renderWithProviders } from '@/test/test-utils';
import { adminApi } from '../../api/adminApi';
import type { IUser } from '@petverse/shared-types';

vi.mock('../../api/adminApi', () => ({
  adminApi: {
    listUsers: vi.fn(),
    toggleUserStatus: vi.fn(),
    updateUserRole: vi.fn(),
  },
}));

const mockUsers: IUser[] = [
  {
    _id: 'u1',
    email: 'alice@example.com',
    profile: { firstName: 'Alice', lastName: 'Johnson' },
    role: 'pet_owner',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any,
  {
    _id: 'u2',
    email: 'vet.bob@example.com',
    profile: { firstName: 'Bob', lastName: 'Smith' },
    role: 'vet',
    isActive: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any,
];

describe('AdminUsersPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(adminApi.listUsers).mockResolvedValue({
      data: mockUsers,
      total: 2,
    });
  });

  it('renders user directory table with user details', async () => {
    renderWithProviders(<AdminUsersPage />);

    expect(await screen.findByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
    expect(screen.getByText('vet.bob@example.com')).toBeInTheDocument();
    expect(screen.getByText('Bob Smith')).toBeInTheDocument();
  });

  it('displays user roles and status badges accurately', async () => {
    renderWithProviders(<AdminUsersPage />);

    expect(await screen.findByText('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  it('dispatches status toggle when toggle action is confirmed', async () => {
    // Mock window.confirm
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.mocked(adminApi.toggleUserStatus).mockResolvedValueOnce({
      _id: 'u1',
      isActive: false,
    } as any);

    renderWithProviders(<AdminUsersPage />);

    expect(await screen.findByText('alice@example.com')).toBeInTheDocument();

    // Click Deactivate button for active user
    const deactivateBtn = screen.getByRole('button', { name: /deactivate/i });
    fireEvent.click(deactivateBtn);

    await waitFor(() => {
      expect(adminApi.toggleUserStatus).toHaveBeenCalledWith('u1', { isActive: false });
    });
  });

  it('filters users by role when dropdown is changed', async () => {
    renderWithProviders(<AdminUsersPage />);

    expect(await screen.findByText('alice@example.com')).toBeInTheDocument();

    const roleSelect = screen.getByDisplayValue(/all roles/i);
    fireEvent.change(roleSelect, { target: { value: 'vet' } });

    await waitFor(() => {
      expect(adminApi.listUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'vet',
        })
      );
    });
  });
});
