import { createContext } from 'react';
import type { Language } from '../types/language';

export interface AuthUser {
  id: number;
  username: string;
  language?: Language;
}

export interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (username: string, password: string, language?: Language) => Promise<void>;
  updateUserLanguage: (language: Language) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
