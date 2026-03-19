import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface AuthUser {
  id: number;
  username: string;
  balance: number;
  commission_today: number;
  vip_level: number;
  invite_code?: string | null;
  credit_score?: number;
  tasks_completed_in_set: number;
  task_count_today: number;
  withdraw_password?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'optimization-front-user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const persistUser = (nextUser: AuthUser | null) => {
    setUser(nextUser);
    if (nextUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const login = async (username: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(error.detail || 'Login failed');
    }

    const data = await response.json();
    persistUser({ ...data, credit_score: data.credit_score ?? 100 });
  };

  const refreshUser = async () => {
    if (!user?.id) return;
    const response = await fetch(`/api/users/${user.id}/overview`);
    if (!response.ok) {
      if (response.status === 404) {
        persistUser(null);
      }
      return;
    }
    const data = await response.json();
    persistUser({ ...data, credit_score: data.credit_score ?? 100 });
  };

  const logout = () => {
    persistUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
