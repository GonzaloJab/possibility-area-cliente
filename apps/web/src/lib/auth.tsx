import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, tokenStore } from './api';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  loading: boolean;
  isImpersonating: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthCtx = createContext<AuthState | null>(null);

// If the URL contains ?impersonation=TOKEN (admin handoff), grab it
// and replace localStorage. Then strip the param so it doesn't linger.
function consumeImpersonationToken(): boolean {
  const url = new URL(window.location.href);
  const token = url.searchParams.get('impersonation');
  if (!token) return false;
  tokenStore.set(token);
  url.searchParams.delete('impersonation');
  window.history.replaceState({}, '', url.toString());
  return true;
}

function decodeJwtPayload(token: string): { impersonator?: string } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);

  useEffect(() => {
    consumeImpersonationToken();
    const token = tokenStore.get();
    if (!token) { setLoading(false); return; }

    setIsImpersonating(!!decodeJwtPayload(token)?.impersonator);

    api.me()
      .then(({ user }) => setUser(user))
      .catch(() => { tokenStore.clear(); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthState>(() => ({
    user, loading, isImpersonating,
    login: async (email, password) => {
      const { token, user } = await api.login(email, password);
      tokenStore.set(token);
      setIsImpersonating(false);
      setUser(user);
    },
    logout: () => { tokenStore.clear(); setUser(null); setIsImpersonating(false); },
  }), [user, loading, isImpersonating]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
