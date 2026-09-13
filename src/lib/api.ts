import axios, { AxiosError, AxiosInstance } from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api: AxiosInstance = axios.create({
  baseURL: `${baseURL}/api`,
  withCredentials: false,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Promise-style refresh queue — single-flight per tab, all waiters receive the rotated tokens.
type Resolver = (token: string, refreshToken: string) => void;

let pendingRefresh: Promise<void> | null = null;
let waiters: Resolver[] = [];

function refreshTokens(refreshToken: string): Promise<void> {
  if (pendingRefresh) return pendingRefresh;

  pendingRefresh = axios
    .post<{ accessToken: string; refreshToken: string }>(`${baseURL}/api/auth/refresh`, {
      refreshToken,
    })
    .then(({ data }) => {
      // Persist the rotated tokens BEFORE resolving waiters so any retried
      // requests pick up the fresh pair.
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);

      waiters.forEach((resolve) => resolve(data.accessToken, data.refreshToken));
      waiters = [];
    })
    .catch((err) => {
      // Reject all waiters
      waiters.forEach((resolve) => resolve('', ''));
      waiters = [];
      throw err;
    })
    .finally(() => {
      pendingRefresh = null;
    });

  return pendingRefresh;
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (typeof error.config & { _retry?: boolean }) | undefined;
    if (error.response?.status !== 401 || !original || original._retry) {
      return Promise.reject(error);
    }
    original._retry = true;

    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      clearAuthAndRedirect();
      return Promise.reject(error);
    }

    try {
      await refreshTokens(refreshToken);
      const newAccess = localStorage.getItem('accessToken');
      if (!newAccess) throw new Error('Refresh produced no token');
      original.headers = original.headers ?? {};
      (original.headers as Record<string, string>).Authorization = `Bearer ${newAccess}`;
      return api(original);
    } catch {
      clearAuthAndRedirect();
      return Promise.reject(error);
    }
  },
);

function clearAuthAndRedirect() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}