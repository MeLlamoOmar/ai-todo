import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from '../lib/authContext';
import { getSupabaseClient } from '../lib/supabaseClient';
import type { AuthState } from '../types/auth';
import { watchAuthSession } from '../utils/watchAuthSession';

const loadingState: AuthState = { user: null, isLoading: true, error: null };

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadingState);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => watchAuthSession(setState), [attempt]);

  function retry() {
    setState(loadingState);
    setAttempt((current) => current + 1);
  }

  async function signOut() {
    const { error } = await getSupabaseClient().auth.signOut({ scope: 'local' });
    if (error) throw error;
    setState({ user: null, isLoading: false, error: null });
  }

  return (
    <AuthContext value={{ ...state, retry, signOut }}>
      {children}
    </AuthContext>
  );
}
