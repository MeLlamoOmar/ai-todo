CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated, service_role;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE private.integration_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 80),
  token_hash text NOT NULL UNIQUE CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  scopes text[] NOT NULL DEFAULT ARRAY['transactions:create']::text[]
    CHECK (scopes <@ ARRAY['transactions:create']::text[]),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  last_used_at timestamptz,
  CHECK (expires_at > created_at)
);
CREATE INDEX integration_tokens_user_idx ON private.integration_tokens(user_id);
ALTER TABLE private.integration_tokens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.integration_tokens FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION public.create_integration(p_name text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  owner_id uuid := auth.uid();
  secret text;
  row_data private.integration_tokens;
  issued_at timestamptz;
BEGIN
  IF owner_id IS NULL THEN
    RAISE EXCEPTION 'Sign in to create an integration.' USING ERRCODE = '42501';
  END IF;
  IF p_name IS NULL OR length(btrim(p_name)) NOT BETWEEN 1 AND 80 THEN
    RAISE EXCEPTION 'Use an integration name between 1 and 80 characters.' USING ERRCODE = '22023';
  END IF;
  -- Serialize issuance for this account, including concurrent browser tabs.
  PERFORM id FROM auth.users WHERE id = owner_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Account is unavailable.' USING ERRCODE = '42501';
  END IF;
  issued_at := clock_timestamp();
  IF (SELECT count(*) FROM private.integration_tokens
      WHERE user_id = owner_id AND revoked_at IS NULL AND expires_at > issued_at) >= 5 THEN
    RAISE EXCEPTION 'You can have at most 5 active integrations. Revoke one first.' USING ERRCODE = '22023';
  END IF;
  secret := 'it_' || encode(extensions.gen_random_bytes(32), 'hex');
  INSERT INTO private.integration_tokens(user_id, name, token_hash, created_at, expires_at)
  VALUES (owner_id, btrim(p_name), encode(extensions.digest(secret, 'sha256'), 'hex'),
          issued_at, issued_at + interval '90 days')
  RETURNING * INTO row_data;
  -- No other routine returns the original secret, nor its hash.
  PERFORM set_config('response.headers', '[{"Cache-Control":"no-store"}]', true);
  RETURN (to_jsonb(row_data) - 'user_id' - 'token_hash') || jsonb_build_object('token', secret);
END;
$$;

CREATE FUNCTION public.list_integrations()
RETURNS TABLE(id uuid, name text, scopes text[], created_at timestamptz,
              expires_at timestamptz, revoked_at timestamptz, last_used_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT t.id, t.name, t.scopes, t.created_at, t.expires_at, t.revoked_at, t.last_used_at
  FROM private.integration_tokens t
  WHERE t.user_id = (SELECT auth.uid())
  ORDER BY t.created_at DESC, t.id;
$$;

CREATE FUNCTION public.revoke_integration(p_integration_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE revoked_id uuid;
BEGIN
  UPDATE private.integration_tokens
  SET revoked_at = coalesce(revoked_at, clock_timestamp())
  WHERE id = p_integration_id AND user_id = (SELECT auth.uid())
  RETURNING id INTO revoked_id;
  RETURN revoked_id IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.create_integration(text), public.list_integrations(),
  public.revoke_integration(uuid) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_integration(text), public.list_integrations(),
  public.revoke_integration(uuid) TO authenticated;
