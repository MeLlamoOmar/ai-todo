import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createIntegration, listIntegrations, revokeIntegration, getIntegrationStatus } from './integrationRepository';
import type { Integration } from '../types/integration';

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('../lib/supabaseClient', () => ({ getSupabaseClient: () => ({ rpc }) }));
const integration: Integration = { id: 'device-1', name: 'iPhone', scopes: ['transactions:create'],
  created_at: '2026-10-17T00:00:00Z', expires_at: '2027-01-15T00:00:00Z', revoked_at: null, last_used_at: null };

beforeEach(() => vi.resetAllMocks());

describe('integration repository', () => {
  it('loads only metadata through the authenticated RPC', async () => {
    rpc.mockResolvedValue({ data: [integration], error: null });
    expect(await listIntegrations()).toEqual([integration]);
    expect(rpc).toHaveBeenCalledWith('list_integrations');
  });
  it('returns the newly issued secret without choosing an owner or permissions', async () => {
    rpc.mockResolvedValue({ data: { ...integration, token: 'one-time-secret' }, error: null });
    expect((await createIntegration('iPhone')).token).toBe('one-time-secret');
    expect(rpc).toHaveBeenCalledWith('create_integration', { p_name: 'iPhone' });
  });
  it('does not claim revocation succeeded when the integration is unavailable', async () => {
    rpc.mockResolvedValue({ data: false, error: null });
    await expect(revokeIntegration('another-user-device')).rejects.toThrow('no longer available');
  });
  it('propagates errors', async () => {
    rpc.mockResolvedValue({ data: null, error: new Error('Unavailable') });
    await expect(listIntegrations()).rejects.toThrow('Unavailable');
  });
  it('derives active, expired, and revoked statuses using the expiry boundary', () => {
    const expiry = Date.parse(integration.expires_at);
    expect(getIntegrationStatus(integration, expiry - 1)).toBe('Active');
    expect(getIntegrationStatus(integration, expiry)).toBe('Expired');
    expect(getIntegrationStatus({ ...integration, revoked_at: integration.created_at }, expiry - 1)).toBe('Revoked');
  });
});
