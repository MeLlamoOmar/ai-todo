import { createContext, useContext } from 'react';
import type { AuthState } from '../types/auth';

type AuthContextValue = AuthState & {
  retry: () => void;
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const auth = useContext(AuthContext);

  if (!auth) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return auth;
}
