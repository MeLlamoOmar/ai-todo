import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { watchAuthSession } from './watchAuthSession';

const { initialize, getClaims, onAuthStateChange, unsubscribe } = vi.hoisted(() => ({
  initialize: vi.fn(), getClaims: vi.fn(), onAuthStateChange: vi.fn(), unsubscribe: vi.fn(),
}));

vi.mock('../lib/supabaseClient', () => ({
  getSupabaseClient: () => ({ auth: { initialize, getClaims, onAuthStateChange } }),
}));

type Session = { user: { id: string } } | null;
let emit: (event: string, session: Session) => void;
let stop: (() => void) | undefined;

function claims(id: string) {
  return { data: { claims: { sub: id, email: `${id}@example.com` } }, error: null };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.resetAllMocks();
  initialize.mockResolvedValue({ error: null });
  getClaims.mockResolvedValue({ data: null, error: null });
  onAuthStateChange.mockImplementation((callback: typeof emit) => {
    emit = callback;
    return { data: { subscription: { unsubscribe } } };
  });
});

afterEach(() => {
  stop?.();
  stop = undefined;
  vi.useRealTimers();
});

describe('watchAuthSession', () => {
  it('finishes checking when no user is signed in', async () => {
    const onChange = vi.fn();
    stop = watchAuthSession(onChange);
    await vi.runAllTimersAsync();
    expect(onChange).toHaveBeenLastCalledWith({ user: null, isLoading: false, error: null });
  });

  it('uses validated claims and defers SDK calls outside auth callbacks', async () => {
    const onChange = vi.fn();
    stop = watchAuthSession(onChange);
    await vi.runAllTimersAsync();
    getClaims.mockClear().mockResolvedValue(claims('alice'));
    emit('SIGNED_IN', { user: { id: 'alice' } });
    expect(getClaims).not.toHaveBeenCalled();
    expect(onChange).toHaveBeenLastCalledWith({ user: null, isLoading: true, error: null });
    await vi.runAllTimersAsync();
    expect(onChange).toHaveBeenLastCalledWith({
      user: { id: 'alice', email: 'alice@example.com' }, isLoading: false, error: null,
    });
  });

  it('preserves the dashboard during a token refresh for the same user', async () => {
    getClaims.mockResolvedValue(claims('alice'));
    const onChange = vi.fn();
    stop = watchAuthSession(onChange);
    await vi.runAllTimersAsync();
    onChange.mockClear();
    emit('TOKEN_REFRESHED', { user: { id: 'alice' } });
    expect(onChange).not.toHaveBeenCalled();
    await vi.runAllTimersAsync();
    expect(onChange.mock.lastCall?.[0].user.id).toBe('alice');
  });

  it('hides the previous account while validating a different user', async () => {
    getClaims.mockResolvedValue(claims('alice'));
    const onChange = vi.fn();
    stop = watchAuthSession(onChange);
    await vi.runAllTimersAsync();
    getClaims.mockResolvedValue(claims('bob'));
    emit('SIGNED_IN', { user: { id: 'bob' } });
    expect(onChange).toHaveBeenLastCalledWith({ user: null, isLoading: true, error: null });
    await vi.runAllTimersAsync();
    expect(onChange.mock.lastCall?.[0].user.id).toBe('bob');
  });

  it('discards a validation that finishes after sign-out', async () => {
    let resolveCheck: (value: ReturnType<typeof claims>) => void = () => {};
    getClaims.mockImplementationOnce(() => new Promise((resolve) => { resolveCheck = resolve; }));
    const onChange = vi.fn();
    stop = watchAuthSession(onChange);
    await vi.runAllTimersAsync();
    emit('SIGNED_OUT', null);
    resolveCheck(claims('alice'));
    await vi.runAllTimersAsync();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith({ user: null, isLoading: false, error: null });
  });

  it('reports OAuth code exchange failures instead of silently redirecting', async () => {
    initialize.mockResolvedValue({ error: new Error('The OAuth code has expired.') });
    const onChange = vi.fn();
    stop = watchAuthSession(onChange);
    await vi.runAllTimersAsync();
    expect(onChange).toHaveBeenLastCalledWith({
      user: null, isLoading: false, error: 'The OAuth code has expired.',
    });
    expect(getClaims).not.toHaveBeenCalled();
  });

  it('clears the user if JWT validation fails', async () => {
    getClaims.mockResolvedValue({ data: null, error: new Error('Invalid JWT') });
    const onChange = vi.fn();
    stop = watchAuthSession(onChange);
    await vi.runAllTimersAsync();
    expect(onChange).toHaveBeenLastCalledWith({ user: null, isLoading: false, error: 'Invalid JWT' });
  });

  it('cancels scheduled work and unsubscribes on cleanup', async () => {
    const onChange = vi.fn();
    stop = watchAuthSession(onChange);
    await vi.runAllTimersAsync();
    onChange.mockClear();
    getClaims.mockClear();
    emit('SIGNED_IN', { user: { id: 'alice' } });
    onChange.mockClear();
    stop();
    await vi.runAllTimersAsync();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    expect(getClaims).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
    stop = undefined;
  });

  it('does not subscribe when unmounted before initialization finishes', async () => {
    const onChange = vi.fn();
    stop = watchAuthSession(onChange);
    stop();
    await vi.runAllTimersAsync();
    expect(onAuthStateChange).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();
    stop = undefined;
  });
});
