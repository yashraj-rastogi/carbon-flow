'use client';

import { useState, useEffect, useCallback } from 'react';
import type { UserProfile } from '@/types';
import { STORAGE_KEY_TOKEN, STORAGE_KEY_USER, STORAGE_KEY_TELEMETRY } from '@/constants';

/** Return type for the useAuth hook. */
export interface UseAuthReturn {
  token: string | null;
  user: UserProfile | null;
  authError: string | null;
  usernameInput: string;
  isRegistering: boolean;
  loading: boolean;
  setUsernameInput: (value: string) => void;
  setIsRegistering: (value: boolean) => void;
  handleAuth: (e: React.FormEvent) => Promise<void>;
  handleLogout: () => void;
}

/**
 * Custom hook encapsulating all authentication logic.
 * Manages token persistence in localStorage, login/register API calls,
 * and session restoration on mount.
 */
export function useAuth(): UseAuthReturn {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
    const savedUser = localStorage.getItem(STORAGE_KEY_USER);
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser) as UserProfile);
      } catch {
        // Corrupted storage — clear and reset
        localStorage.removeItem(STORAGE_KEY_TOKEN);
        localStorage.removeItem(STORAGE_KEY_USER);
      }
    }
    setLoading(false);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_TELEMETRY);
    setToken(null);
    setUser(null);
  }, []);

  const handleAuth = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!usernameInput.trim()) return;

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: usernameInput.trim(),
          action: isRegistering ? 'register' : 'login',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem(STORAGE_KEY_TOKEN, data.token);
        localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user as UserProfile);
      } else {
        setAuthError(data.error || 'Authentication failed');
      }
    } catch {
      setAuthError('Server connection issue');
    }
  }, [usernameInput, isRegistering]);

  return {
    token,
    user,
    authError,
    usernameInput,
    isRegistering,
    loading,
    setUsernameInput,
    setIsRegistering,
    handleAuth,
    handleLogout,
  };
}
