import type { Supply, Invoice, Consumption, Tariff, User } from '../types';

/** Dev: empty `VITE_API_URL` → `/api` (Vite proxy). Prod: set `VITE_API_URL` on Render when the Docker image builds — not from repo-root `.env` on your laptop. */
const trimmed = String(import.meta.env.VITE_API_URL ?? '').trim();
const API_URL =
  trimmed !== '' ? trimmed : import.meta.env.DEV ? '/api' : '';
const TOKEN_KEY = 'possibility_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function assertProductionApiUrl(): void {
  if (import.meta.env.DEV) return;
  if (!API_URL.trim()) {
    throw new ApiError(
      503,
      'VITE_API_URL was not set when this build was produced. On Render: possibility-web → Environment → VITE_API_URL = https://<your-public-api> → Clear build cache → Deploy.',
    );
  }
  try {
    const host = new URL(API_URL).hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      throw new ApiError(
        503,
        'VITE_API_URL still points at localhost — the Docker build used a wrong value. On Render: set VITE_API_URL to your public API (https://…) and redeploy.',
      );
    }
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(503, 'VITE_API_URL is not a valid URL. Fix Render web service env and redeploy.');
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  assertProductionApiUrl();
  const token = tokenStore.get();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, password: string, name: string) =>
    request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),
  me: () => request<{ user: User }>('/auth/me'),
  supplies: () => request<{ supplies: Supply[] }>('/supplies'),
  supply: (id: string) => request<{ supply: Supply }>(`/supplies/${id}`),
  invoices: (supplyId: string) =>
    request<{ invoices: Invoice[] }>(`/supplies/${supplyId}/invoices`),
  consumption: (supplyId: string) =>
    request<{ consumption: Consumption[] }>(`/supplies/${supplyId}/consumption`),
  tariff: (supplyId: string) => request<{ tariff: Tariff }>(`/supplies/${supplyId}/tariff`),
};

export { ApiError };
