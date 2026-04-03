import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { adminSupportLogin, type SupportLoginResult } from '../lib/adminApi';

type AdminSession = SupportLoginResult;

type AdminAuthContextValue = {
  session: AdminSession | null;
  token: string | null;
  role: string | null;
  username: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const STORAGE_KEY = 'admin_auth_session';

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

function readStoredSession(): AdminSession | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as AdminSession;
    if (!parsed.token || !parsed.username || !parsed.role) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(() => readStoredSession());

  const login = async (username: string, password: string) => {
    const nextSession = await adminSupportLogin(username, password);
    setSession(nextSession);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
  };

  const logout = () => {
    setSession(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      session,
      token: session?.token ?? null,
      role: session?.role ?? null,
      username: session?.username ?? null,
      isAuthenticated: Boolean(session?.token),
      login,
      logout,
    }),
    [session],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return ctx;
}
