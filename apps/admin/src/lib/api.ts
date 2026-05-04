import type {
  ClientDetail, ClientSummary, InvoiceImportItem, OcrPreview, Supply, User,
} from '../types';

/** Dev: empty `VITE_API_URL` → `/api`. Prod: set `VITE_API_URL` (+ `VITE_CLIENT_URL`) when the admin Docker image builds on Render. */
const trimmed = String(import.meta.env.VITE_API_URL ?? '').trim();
const API_URL =
  trimmed !== '' ? trimmed : import.meta.env.DEV ? '/api' : '';
const TOKEN_KEY = 'possibility_admin_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

function assertProductionApiUrl(): void {
  if (import.meta.env.DEV) return;
  if (!API_URL.trim()) {
    throw new ApiError(
      503,
      'VITE_API_URL was not set when this build was produced. On Render: possibility-admin → Environment → VITE_API_URL = https://<your-public-api> → Clear build cache → Deploy.',
    );
  }
  try {
    const host = new URL(API_URL).hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      throw new ApiError(
        503,
        'VITE_API_URL still points at localhost. Set it to your public API (https://…) on the admin service and redeploy.',
      );
    }
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(503, 'VITE_API_URL is not a valid URL. Fix Render admin service env and redeploy.');
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  isJson = true,
): Promise<T> {
  assertProductionApiUrl();
  const token = tokenStore.get();
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers as Record<string, string> | undefined),
  };
  if (isJson && init.body && !(init.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.detail ?? body.error ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  // ─── Auth ──
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    }),
  me: () => request<{ user: User }>('/auth/me'),

  // ─── Clients ──
  listClients: () => request<{ clients: ClientSummary[] }>('/admin/clients'),
  getClient: (id: string) => request<{ client: ClientDetail }>(`/admin/clients/${id}`),
  createClient: (email: string, name: string) =>
    request<{ user: User; tempPassword: string }>('/admin/clients', {
      method: 'POST', body: JSON.stringify({ email, name }),
    }),
  updateClient: (id: string, body: Partial<{ name: string; email: string; isActive: boolean }>) =>
    request<{ client: ClientDetail }>(`/admin/clients/${id}`, {
      method: 'PATCH', body: JSON.stringify(body),
    }),
  deleteClient: (id: string) =>
    request<void>(`/admin/clients/${id}`, { method: 'DELETE' }),
  resetPassword: (id: string) =>
    request<{ tempPassword: string }>(`/admin/clients/${id}/reset-password`, { method: 'POST' }),
  impersonate: (id: string) =>
    request<{ token: string; user: User; expiresInMinutes: number }>(
      `/admin/clients/${id}/impersonate`, { method: 'POST' },
    ),

  // ─── Supplies ──
  createSupply: (clientId: string, body: Partial<Supply>) =>
    request<Supply>(`/admin/clients/${clientId}/supplies`, {
      method: 'POST', body: JSON.stringify(body),
    }),
  updateSupply: (supplyId: string, body: Partial<Supply>) =>
    request<Supply>(`/admin/supplies/${supplyId}`, {
      method: 'PATCH', body: JSON.stringify(body),
    }),
  deleteSupply: (supplyId: string) =>
    request<void>(`/admin/supplies/${supplyId}`, { method: 'DELETE' }),

  // ─── OCR + bulk invoice import ──
  ocrPreview: async (supplyId: string, files: File[]): Promise<{ previews: OcrPreview[] }> => {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    return request<{ previews: OcrPreview[] }>(
      `/admin/supplies/${supplyId}/ocr-preview`, { method: 'POST', body: fd }, false,
    );
  },
  bulkImportInvoices: (supplyId: string, invoices: InvoiceImportItem[]) =>
    request<{ created: number; skipped: string[] }>(
      `/admin/supplies/${supplyId}/invoices/bulk`,
      { method: 'POST', body: JSON.stringify({ invoices }) },
    ),
};

export { ApiError };
