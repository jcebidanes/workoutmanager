import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from './AuthContext';
import type { AuthUser } from './AuthContext';
import type { Language } from '../types/language';
import { DEFAULT_LANGUAGE, isLanguage } from '../types/language';

const AUTH_STORAGE_KEY = 'trainer_app_user';
const TOKEN_STORAGE_KEY = 'trainer_app_token';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const normalizeUser = (raw: AuthUser): AuthUser => ({
    ...raw,
    language: raw.language && isLanguage(raw.language) ? raw.language : DEFAULT_LANGUAGE,
  });

  useEffect(() => {
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (storedUser && storedToken) {
      try {
        const parsed: AuthUser = JSON.parse(storedUser);
        setUser(normalizeUser(parsed));
        setToken(storedToken);
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    }
  }, []);

  const register = async (username: string, password: string, language: Language = DEFAULT_LANGUAGE) => {
    const response = await fetch('http://localhost:3001/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password, language }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.error ?? 'Registration failed');
    }

    const data = await response.json();
    const normalized = normalizeUser(data.user);
    setUser(normalized);
    setToken(data.token);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalized));
    localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
  };

  const login = async (username: string, password: string) => {
    const response = await fetch('http://localhost:3001/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    if (response.ok) {
      const data = await response.json();
      const normalized = normalizeUser(data.user);
      setUser(normalized);
      setToken(data.token);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(normalized));
      localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  };

  const updateUserLanguage = (language: Language) => {
    setUser((prev) => {
      if (!prev) {
        return prev;
      }
      const updated = { ...prev, language };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, register, updateUserLanguage }}>
      {children}
    </AuthContext.Provider>
  );
};
