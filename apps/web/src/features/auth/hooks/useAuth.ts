import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { useAuthStore } from '@/app/store/auth.store';
import { queryClient } from '@/shared/lib/queryClient';
import { getApiErrorMessage } from '@/shared/lib/axios';
import type { LoginInput, RegisterInput } from '../validation/authSchema';

// ─── useLogin ──────────────────────────────────────────────
export function useLogin() {
  const navigate = useNavigate();
  const { setUser, setAccessToken } = useAuthStore();

  return useMutation({
    mutationFn: (dto: LoginInput) => authApi.login(dto),
    onSuccess: (data) => {
      setUser(data.user);
      setAccessToken(data.accessToken);
      navigate('/dashboard');
    },
  });
}

// ─── useRegister ───────────────────────────────────────────
export function useRegister() {
  const navigate = useNavigate();
  const { setUser, setAccessToken } = useAuthStore();

  return useMutation({
    mutationFn: ({ confirmPassword: _, phone, ...dto }: RegisterInput) => {
      const payload: any = { ...dto };
      if (phone && phone.trim() !== '') {
        payload.phone = phone;
      }
      return authApi.register(payload);
    },
    onSuccess: (data) => {
      setUser(data.user);
      setAccessToken(data.accessToken);
      navigate('/auth/verify', { state: { email: data.user.email } });
    },
  });
}

// ─── useLogout ─────────────────────────────────────────────
export function useLogout() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      logout();
      queryClient.clear();
      navigate('/auth/login');
    },
  });
}

// ─── useRefreshToken ───────────────────────────────────────
export function useRefreshToken() {
  const { setAccessToken, setUser, setIsLoading } = useAuthStore();

  return useQuery({
    queryKey: ['auth', 'refresh'],
    queryFn: async () => {
      try {
        const { accessToken } = await authApi.refresh();
        setAccessToken(accessToken);
        const user = await authApi.getMe();
        setUser(user);
        return user;
      } catch {
        setIsLoading(false);
        return null;
      }
    },
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchInterval: 1000 * 60 * 14, // Refresh every 14 minutes (before 15min expiry)
  });
}

// ─── useGoogleAuth ─────────────────────────────────────────
export function useGoogleAuth() {
  const navigate = useNavigate();
  const { setUser, setAccessToken } = useAuthStore();

  return useMutation({
    mutationFn: (idToken: string) => authApi.googleAuth(idToken),
    onSuccess: (data) => {
      setUser(data.user);
      setAccessToken(data.accessToken);
      navigate('/dashboard');
    },
  });
}

// ─── useForgotPassword ─────────────────────────────────────
export function useForgotPassword() {
  return useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
  });
}

// ─── useVerifyOtp ──────────────────────────────────────────
export function useVerifyOtp() {
  const navigate = useNavigate();
  const { updateUser } = useAuthStore();

  return useMutation({
    mutationFn: ({ target, otp }: { target: string; otp: string }) =>
      authApi.verifyOtp(target, otp),
    onSuccess: () => {
      updateUser({ isVerified: true });
      navigate('/dashboard');
    },
  });
}

// ─── useResetPassword ──────────────────────────────────────
export function useResetPassword() {
  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      authApi.resetPassword(token, password),
  });
}

