import type { Supply, Invoice, Consumption, Tariff, User } from '../types';

/** Dev default `/api` uses Vite proxy → 127.0.0.1:4000 (avoids Windows `localhost`→IPv6 vs uvicorn on 127.0.0.1). */
const trimmed = String(import.meta.env.VITE_API_URL ?? '').trim();
const API_URL =
  trimmed !== ''
    ? trimmed
    : import.meta.env.DEV
      ? '/api'
      : 'http://127.0.0.1:4000';
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

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
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
