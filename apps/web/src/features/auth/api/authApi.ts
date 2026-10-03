import api from '@/shared/lib/axios';
import type { IUser, IAuthTokens } from '@petverse/shared-types';

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}

export interface AuthResponse {
  user: IUser;
  accessToken: string;
  expiresIn: number;
}

export const authApi = {
  /** Login with email + password */
  login: (dto: LoginDto) =>
    api.post<{ data: AuthResponse }>('/auth/login', dto).then((r) => r.data.data),

  /** Register a new user */
  register: (dto: RegisterDto) =>
    api.post<{ data: AuthResponse }>('/auth/register', dto).then((r) => r.data.data),

  /** Logout (clears refresh cookie server-side) */
  logout: () => api.post('/auth/logout'),

  /** Silently refresh access token using httpOnly cookie */
  refresh: () =>
    api.post<{ data: { accessToken: string } }>('/auth/refresh').then((r) => r.data.data),

  /** Fetch current user profile */
  getMe: () =>
    api.get<{ data: IUser }>('/users/me').then((r) => r.data.data),

  /** Google OAuth token exchange */
  googleAuth: (idToken: string) =>
    api.post<{ data: AuthResponse }>('/auth/google', { idToken }).then((r) => r.data.data),

  /** Send OTP to email/phone */
  sendOtp: (target: string, type: 'email' | 'phone') =>
    api.post('/auth/send-otp', { target, type }),

  /** Verify OTP */
  verifyOtp: (target: string, otp: string) =>
    api.post<{ data: { verified: boolean } }>('/auth/verify-otp', { target, otp })
      .then((r) => r.data.data),

  /** Request password reset */
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),

  /** Reset password with token */
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
};
