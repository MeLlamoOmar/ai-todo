import { getSupabaseClient } from '../lib/supabaseClient';
import type { Integration, CreatedIntegration } from '../types/integration';

export async function listIntegrations(): Promise<Integration[]> {
  const { data, error } = await getSupabaseClient().rpc('list_integrations');
  if (error) throw error;
  return data;
}

export async function createIntegration(name: string): Promise<CreatedIntegration> {
  const { data, error } = await getSupabaseClient().rpc('create_integration', { p_name: name });
  if (error) throw error;
  return data;
}

export async function revokeIntegration(id: string): Promise<void> {
  const { data, error } = await getSupabaseClient().rpc('revoke_integration', { p_integration_id: id });
  if (error) throw error;
  if (!data) throw new Error('This integration is no longer available.');
}

export function getIntegrationEndpoint() {
  const url = import.meta.env.VITE_SUPABASE_URL;
  if (!url) throw new Error('Supabase URL is required.');
  return `${url.replace(/\/$/, '')}/functions/v1/integration-transactions`;
}

export function getIntegrationStatus(integration: Integration, now = Date.now()) {
  if (integration.revoked_at) return 'Revoked';
  if (Date.parse(integration.expires_at) <= now) return 'Expired';
  return 'Active';
}
