import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from '../LoginPage';
import { renderWithProviders } from '@/test/test-utils';
import { authApi } from '../../api/authApi';

vi.mock('../../api/authApi', () => ({
  authApi: {
    login: vi.fn(),
    googleAuth: vi.fn(),
  },
}));

describe('LoginPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email input, password input, and submit button', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('toggles password visibility when eye button is clicked', () => {
    renderWithProviders(<LoginPage />);

    const passwordInput = screen.getByLabelText(/^password/i) as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    // The button next to password input
    const toggleButtons = screen.getAllByRole('button');
    const eyeButton = toggleButtons.find(
      (btn) => btn.getAttribute('type') === 'button' && !btn.textContent
    );
    expect(eyeButton).toBeDefined();

    if (eyeButton) {
      fireEvent.click(eyeButton);
      expect(passwordInput.type).toBe('text');

      fireEvent.click(eyeButton);
      expect(passwordInput.type).toBe('password');
    }
  });

  it('validates required fields before sending request', async () => {
    renderWithProviders(<LoginPage />);

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(authApi.login).not.toHaveBeenCalled();
    });
  });

  it('calls authApi.login when valid credentials are submitted', async () => {
    vi.mocked(authApi.login).mockResolvedValueOnce({
      user: {
        _id: 'usr_1',
        email: 'test@example.com',
        role: 'pet_owner',
        name: 'Test User',
      } as any,
      accessToken: 'token_123',
      expiresIn: 3600,
    });

    renderWithProviders(<LoginPage />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Secret123!' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Secret123!',
      });
    });
  });

  it('has navigation links to register and forgot password pages', () => {
    renderWithProviders(<LoginPage />);

    const forgotLink = screen.getByRole('link', { name: /forgot password\?/i });
    expect(forgotLink).toHaveAttribute('href', '/auth/forgot-password');

    const registerLink = screen.getByRole('link', { name: /create one free/i });
    expect(registerLink).toHaveAttribute('href', '/auth/register');
  });
});
