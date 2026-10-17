import { getSupabaseClient } from '../lib/supabaseClient';
import type { AuthState } from '../types/auth';

// Keep SDK calls outside the auth event callback and discard outdated checks.
export function watchAuthSession(onChange: (state: AuthState) => void) {
  let active = true;
  let revision = 0;
  let userId: string | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let unsubscribe: (() => void) | undefined;

  function reportError(error: unknown) {
    userId = null;
    onChange({
      user: null,
      isLoading: false,
      error: error instanceof Error ? error.message : 'Could not check your session.',
    });
  }

  async function validateSession(checkRevision: number) {
    try {
      const { data, error } = await getSupabaseClient().auth.getClaims();

      if (!active || checkRevision !== revision) return;
      if (error) throw error;

      const claims = data?.claims;
      userId = claims?.sub ?? null;
      onChange({
        user: userId ? { id: userId, email: claims?.email } : null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      if (active && checkRevision === revision) reportError(error);
    }
  }

  function scheduleValidation() {
    const checkRevision = ++revision;
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (active) void validateSession(checkRevision);
    }, 0);
  }

  async function start() {
    try {
      const auth = getSupabaseClient().auth;
      // This also reports failures exchanging the OAuth callback code.
      const { error } = await auth.initialize();
      if (!active) return;
      if (error) throw error;

      const { data } = auth.onAuthStateChange((_event, session) => {
        if (!active) return;

        if (!session) {
          ++revision;
          clearTimeout(timer);
          userId = null;
          onChange({ user: null, isLoading: false, error: null });
          return;
        }

        if (session.user.id !== userId) {
          onChange({ user: null, isLoading: true, error: null });
        }
        scheduleValidation();
      });
      unsubscribe = () => data.subscription.unsubscribe();
      scheduleValidation();
    } catch (error) {
      if (active) reportError(error);
    }
  }

  void start();

  return () => {
    active = false;
    ++revision;
    clearTimeout(timer);
    unsubscribe?.();
  };
}
