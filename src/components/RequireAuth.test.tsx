import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from '../lib/authContext';
import type { AuthState } from '../types/auth';
import RequireAuth from './RequireAuth';

function render(state: AuthState) {
  return renderToStaticMarkup(
    <AuthContext value={{ ...state, retry: vi.fn(), signOut: vi.fn() }}>
      <MemoryRouter>
        <RequireAuth><p>Private dashboard</p></RequireAuth>
      </MemoryRouter>
    </AuthContext>,
  );
}

describe('RequireAuth', () => {
  it('does not render the dashboard before the session is validated', () => {
    const html = render({ user: null, isLoading: true, error: null });
    expect(html).toContain('Checking your session');
    expect(html).not.toContain('Private dashboard');
  });

  it('does not render the dashboard for a signed-out user', () => {
    expect(render({ user: null, isLoading: false, error: null })).toBe('');
  });

  it('offers recovery without rendering private data if validation fails', () => {
    const html = render({ user: null, isLoading: false, error: 'Invalid JWT' });
    expect(html).toContain('Invalid JWT');
    expect(html).toContain('Retry');
    expect(html).toContain('href="/auth"');
    expect(html).not.toContain('Private dashboard');
  });

  it('renders the dashboard for a validated user', () => {
    expect(render({ user: { id: 'alice' }, isLoading: false, error: null }))
      .toContain('Private dashboard');
  });
});
