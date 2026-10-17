import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
import type { Database } from '../../../src/types/database.ts';
import { createIntegrationHandler } from './handler.ts';

// The incoming integration token is never used as a Supabase session JWT.
// This handler only invokes the restricted integration procedures.
const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}') as Record<string, string>;
const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? secretKeys.default;
const url = Deno.env.get('SUPABASE_URL');
if (!url || !secret) throw new Error('Integration backend configuration is missing.');
const client = createClient<Database>(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

Deno.serve(createIntegrationHandler({
  async authorize(hash) {
    const { data, error } = await client.rpc('authorize_integration', { p_token_hash: hash });
    if (error || !data) throw new Error('Integration authorization failed.');
    return data;
  },
  async create(hash, key, values) {
    const { data, error } = await client.rpc('process_integration_transaction', {
      p_token_hash: hash, p_request_key: key, p_values: values,
    });
    if (error || !data) throw new Error('Integration request failed.');
    return data;
  },
}));
