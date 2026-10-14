import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/app/store/auth.store';

// ─── Axios Instance ────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // send httpOnly refresh token cookie
});

// ─── Request Interceptor ───────────────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // AI routes involve large image payloads + model chain fallbacks — give them more time
    if (config.url?.startsWith('/ai/')) {
      config.timeout = 60_000;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor (silent token refresh) ──────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only attempt refresh on 401, not on the refresh endpoint itself
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post<{
          data: { accessToken: string };
        }>('/auth/refresh');

        const newToken = data.data.accessToken;
        useAuthStore.getState().setAccessToken(newToken);

        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
export const axiosInstance = api;

/** Returns true if the error is an Axios request timeout (ECONNABORTED) or a cancelled request */
export function isTimeoutError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  return (
    error.code === 'ECONNABORTED' ||
    error.code === 'ERR_CANCELED' ||
    (typeof error.message === 'string' && error.message.includes('timeout'))
  );
}

/** Returns true if the error is a network connectivity failure (no response received) */
export function isNetworkError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;
  return !error.response && error.code !== 'ECONNABORTED' && error.code !== 'ERR_CANCELED';
}

/** Extract a user-friendly error message from an Axios error */
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    // Timeout / aborted by client
    if (
      error.code === 'ECONNABORTED' ||
      error.code === 'ERR_CANCELED' ||
      (typeof error.message === 'string' && error.message.includes('timeout'))
    ) {
      return 'The request is taking longer than expected. Please try again.';
    }

    // Network unreachable (no response received at all)
    if (!error.response) {
      return 'A network error occurred. Please check your connection and try again.';
    }

    // Server-returned error body
    const data = error.response?.data as {
      error?: { message?: string };
      message?: string;
    };
    return data?.error?.message ?? data?.message ?? error.message ?? 'Something went wrong';
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}
