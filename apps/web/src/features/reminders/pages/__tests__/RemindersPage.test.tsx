import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RemindersPage from '../RemindersPage';
import { renderWithProviders } from '@/test/test-utils';
import type { IReminder } from '@petverse/shared-types';

const mockCompleteMutate = vi.fn();
const mockSnoozeMutateAsync = vi.fn();
const mockCreateMutateAsync = vi.fn();

const mockPet = {
  _id: 'pet_001',
  name: 'Luna',
  species: 'cat',
};

const mockReminders: IReminder[] = [
  {
    _id: 'rem_1',
    ownerId: 'user_1',
    petId: 'pet_001',
    title: 'Heartworm Medication',
    message: 'Give monthly chewable',
    type: 'medication',
    priority: 'high',
    frequency: 'monthly',
    timezone: 'UTC',
    nextTrigger: new Date(Date.now() + 3600000).toISOString(),
    isActive: true,
    missedCount: 0,
    completedCount: 0,
    escalation: {
      maxRetries: 3,
      retryIntervalMinutes: 15,
      notifySecondaryOwner: false,
      emergencyEscalation: false,
    },
    notificationChannels: ['in-app'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

vi.mock('../../hooks/useReminders', () => ({
  useMyReminders: vi.fn(),
  useCompleteReminder: () => ({
    mutate: mockCompleteMutate,
    isPending: false,
  }),
  useSnoozeReminder: () => ({
    mutateAsync: mockSnoozeMutateAsync,
    isPending: false,
  }),
  useCreateReminder: () => ({
    mutateAsync: mockCreateMutateAsync,
    isPending: false,
  }),
}));

vi.mock('@/features/pets/hooks/usePets', () => ({
  usePets: () => ({
    data: { data: [mockPet] },
    isLoading: false,
  }),
}));

import { useMyReminders } from '../../hooks/useReminders';

describe('RemindersPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when there are no reminders', () => {
    vi.mocked(useMyReminders).mockReturnValue({
      data: [],
      isLoading: false,
    } as any);

    renderWithProviders(<RemindersPage />);

    expect(screen.getByText(/no upcoming reminders/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create first reminder/i })).toBeInTheDocument();
  });

  it('renders reminder list with reminder card details', () => {
    vi.mocked(useMyReminders).mockReturnValue({
      data: mockReminders,
      isLoading: false,
    } as any);

    renderWithProviders(<RemindersPage />);

    expect(screen.getByText('Heartworm Medication')).toBeInTheDocument();
    expect(screen.getByText('Give monthly chewable')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /snooze/i })).toBeInTheDocument();
  });

  it('calls complete reminder mutation when mark done button is clicked', () => {
    vi.mocked(useMyReminders).mockReturnValue({
      data: mockReminders,
      isLoading: false,
    } as any);

    renderWithProviders(<RemindersPage />);

    const doneButton = screen.getByRole('button', { name: /done/i });
    fireEvent.click(doneButton);

    expect(mockCompleteMutate).toHaveBeenCalledWith('rem_1');
  });

  it('opens snooze modal and dispatches snooze with selected hours', async () => {
    mockSnoozeMutateAsync.mockResolvedValueOnce({ success: true });

    vi.mocked(useMyReminders).mockReturnValue({
      data: mockReminders,
      isLoading: false,
    } as any);

    renderWithProviders(<RemindersPage />);

    const snoozeButton = screen.getByRole('button', { name: /snooze/i });
    fireEvent.click(snoozeButton);

    // Snooze modal should now be visible
    expect(screen.getByText(/snooze reminder/i, { selector: 'h3' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '4 Hrs' })).toBeInTheDocument();

    // Select 8 Hrs preset
    fireEvent.click(screen.getByRole('button', { name: '8 Hrs' }));

    // Click confirm snooze button
    const confirmButton = screen.getByRole('button', { name: /Snooze \(8h\)/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockSnoozeMutateAsync).toHaveBeenCalledWith({
        id: 'rem_1',
        hours: 8,
      });
    });
  });

  it('opens create modal with cron presets and escalation configuration', () => {
    vi.mocked(useMyReminders).mockReturnValue({
      data: mockReminders,
      isLoading: false,
    } as any);

    renderWithProviders(<RemindersPage />);

    const newReminderButton = screen.getByRole('button', { name: /new reminder/i });
    fireEvent.click(newReminderButton);

    // Modal title
    expect(screen.getByText('Create New Reminder')).toBeInTheDocument();

    // Escalation config section toggle
    expect(screen.getByText(/Escalation & Dispatch Settings/i)).toBeInTheDocument();
  });
});
