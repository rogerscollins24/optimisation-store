import React, { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { getClientSupportUnreadCount } from '../lib/supportApi';

export interface AuthUser {
  id: number;
  username: string;
  status?: string;
  email?: string | null;
  phone?: string | null;
  gender?: string | null;
  balance: number;
  commission?: number;
  commission_today: number;
  vip_level: number;
  invite_code?: string | null;
  credit_score?: number;
  tasks_completed_in_set: number;
  task_count_today: number;
  current_set?: number;
  remaining_tasks?: number;
  tasks_per_set?: number;
  withdraw_password?: string | null;
  exchange?: string | null;
  wallet_address?: string | null;
  role?: string;
  access_token?: string;
  token_type?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  supportUnreadCount: number;
  notificationCount: number;
  login: (username: string, password: string, captchaNumA: number, captchaNumB: number, captchaAnswer: number) => Promise<void>;
  signup: (
    email: string,
    password: string,
    captchaNumA: number,
    captchaNumB: number,
    captchaAnswer: number,
    referralCode?: string,
  ) => Promise<string>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  refreshBadges: () => Promise<void>;
  markNotificationsRead: (ids: number[]) => void;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'optimization-front-user';
const NOTIFICATION_READ_KEY = 'optimization-front-read-notifications';

function getReadNotificationIds(): number[] {
  try {
    const raw = localStorage.getItem(NOTIFICATION_READ_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map((item) => Number(item)).filter((item) => Number.isFinite(item)) : [];
  } catch {
    return [];
  }
}

function saveReadNotificationIds(ids: number[]) {
  localStorage.setItem(NOTIFICATION_READ_KEY, JSON.stringify(Array.from(new Set(ids))));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [supportUnreadCount, setSupportUnreadCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);

  const setUser: React.Dispatch<React.SetStateAction<AuthUser | null>> = useCallback((value) => {
    setUserState((current) => {
      const next = typeof value === 'function' ? (value as (prev: AuthUser | null) => AuthUser | null)(current) : value;
      if (next) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
      return next;
    });
  }, []);

  const persistUser = useCallback((nextUser: AuthUser | null) => {
    setUser(nextUser);
    if (!nextUser) {
      setSupportUnreadCount(0);
      setNotificationCount(0);
    }
  }, [setUser]);

  const refreshBadgeCounts = useCallback(async (accessToken?: string | null) => {
    if (!accessToken) {
      setSupportUnreadCount(0);
      setNotificationCount(0);
      return;
    }

    const [supportUnread, notifications] = await Promise.all([
      getClientSupportUnreadCount(accessToken).catch(() => 0),
      fetch('/api/notifications')
        .then(async (response) => (response.ok ? response.json() : []))
        .catch(() => []),
    ]);

    setSupportUnreadCount(Number(supportUnread || 0));

    const seenIds = new Set(getReadNotificationIds());
    const activeNotifications = (Array.isArray(notifications) ? notifications : []).filter(
      (item) => String(item?.status ?? 'Active').toLowerCase() === 'active',
    );
    setNotificationCount(activeNotifications.filter((item) => !seenIds.has(Number(item?.id))).length);
  }, []);

  const refreshBadges = useCallback(async () => {
    await refreshBadgeCounts(user?.access_token ?? null);
  }, [refreshBadgeCounts, user?.access_token]);

  const markNotificationsRead = useCallback((ids: number[]) => {
    const current = getReadNotificationIds();
    saveReadNotificationIds([...current, ...ids]);
    void refreshBadgeCounts(user?.access_token ?? null);
  }, [refreshBadgeCounts, user?.access_token]);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setUserState(JSON.parse(raw));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user?.access_token) {
      void refreshBadgeCounts(user.access_token);
      return;
    }
    setSupportUnreadCount(0);
    setNotificationCount(0);
  }, [refreshBadgeCounts, user?.access_token]);

  const login = async (username: string, password: string, captchaNumA: number, captchaNumB: number, captchaAnswer: number) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        password,
        captcha_num_a: captchaNumA,
        captcha_num_b: captchaNumB,
        captcha_answer: captchaAnswer,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(error.detail || 'Login failed');
    }

    const data = await response.json();
    const nextUser = { ...data, credit_score: data.credit_score ?? 100 };
    persistUser(nextUser);
    await refreshBadgeCounts(nextUser.access_token);
  };

  const signup = async (
    email: string,
    password: string,
    captchaNumA: number,
    captchaNumB: number,
    captchaAnswer: number,
    referralCode?: string,
  ) => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        captcha_num_a: captchaNumA,
        captcha_num_b: captchaNumB,
        captcha_answer: captchaAnswer,
        referral_code: referralCode?.trim() ? referralCode.trim() : null,
      }),
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Signup endpoint not found. Restart backend and try again.');
      }
      const error = await response.json().catch(() => ({ detail: 'Signup failed' }));
      throw new Error(error.detail || 'Signup failed');
    }

    const data = await response.json();
    return data?.message || 'Signup submitted. Wait for super admin approval.';
  };

  const refreshUser = useCallback(async () => {
    if (!user?.id) return;
    const response = await fetch(`/api/users/${user.id}/overview`);
    if (!response.ok) {
      if (response.status === 404) {
        persistUser(null);
      }
      return;
    }
    const data = await response.json();
    persistUser({
      ...data,
      credit_score: data.credit_score ?? 100,
      access_token: user.access_token,
      token_type: user.token_type,
    });
    await refreshBadgeCounts(user.access_token);
  }, [user?.id, user?.access_token, user?.token_type, persistUser, refreshBadgeCounts]);

  useEffect(() => {
    if (!user?.id || !user?.access_token) {
      return;
    }

    const refreshImmediately = () => {
      if (document.visibilityState === 'hidden') {
        return;
      }
      void refreshUser();
    };

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'hidden') {
        return;
      }
      void refreshUser();
    }, 5000);

    window.addEventListener('focus', refreshImmediately);
    document.addEventListener('visibilitychange', refreshImmediately);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshImmediately);
      document.removeEventListener('visibilitychange', refreshImmediately);
    };
  }, [user?.id, user?.access_token, refreshUser]);

  const logout = () => {
    persistUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        supportUnreadCount,
        notificationCount,
        login,
        signup,
        logout,
        refreshUser,
        refreshBadges,
        markNotificationsRead,
        setUser,
      }}
    >
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
