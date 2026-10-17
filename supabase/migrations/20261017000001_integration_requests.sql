CREATE TABLE private.integration_requests (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_key uuid NOT NULL,
  request_hash text NOT NULL,
  -- Keep the receipt after a transaction is deleted; a retry must not recreate it.
  transaction_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, request_key)
);
CREATE TABLE private.integration_rate_limits (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  window_start timestamptz NOT NULL,
  request_count integer NOT NULL CHECK (request_count BETWEEN 1 AND 31)
);
ALTER TABLE private.integration_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.integration_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON private.integration_requests, private.integration_rate_limits
  FROM PUBLIC, anon, authenticated, service_role;

-- Only privileged wrappers can call this helper. Its locks live until commit,
-- so revocation and account-wide rate limiting also work across Edge instances.
CREATE FUNCTION private.check_integration(p_token_hash text)
RETURNS jsonb LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE
  credential private.integration_tokens;
  current_time_value timestamptz;
  current_window timestamptz;
  request_total integer;
BEGIN
  SELECT * INTO credential FROM private.integration_tokens
  WHERE token_hash = p_token_hash FOR UPDATE;
  current_time_value := clock_timestamp();
  IF NOT FOUND OR credential.revoked_at IS NOT NULL OR credential.expires_at <= current_time_value THEN
    RETURN jsonb_build_object('status', 401, 'code', 'invalid_token', 'message', 'Integration token is invalid or expired.');
  END IF;
  IF NOT ('transactions:create' = ANY(credential.scopes)) THEN
    RETURN jsonb_build_object('status', 403, 'code', 'insufficient_scope', 'message', 'This integration cannot create transactions.');
  END IF;
  current_window := date_trunc('minute', current_time_value);
  INSERT INTO private.integration_rate_limits AS limits(user_id, window_start, request_count)
  VALUES (credential.user_id, current_window, 1)
  ON CONFLICT (user_id) DO UPDATE SET
    window_start = EXCLUDED.window_start,
    request_count = CASE WHEN limits.window_start = EXCLUDED.window_start
      THEN least(limits.request_count + 1, 31) ELSE 1 END
  RETURNING request_count INTO request_total;
  IF request_total > 30 THEN
    -- Return rather than raise, so the counter is committed on a denied request.
    RETURN jsonb_build_object('status', 429, 'code', 'rate_limited', 'message', 'Too many requests. Try again shortly.',
      'retry_after', greatest(1, ceil(extract(epoch FROM current_window + interval '1 minute' - current_time_value))::integer));
  END IF;
  UPDATE private.integration_tokens SET last_used_at = current_time_value WHERE id = credential.id;
  RETURN jsonb_build_object('status', 200, 'user_id', credential.user_id);
END;
$$;
REVOKE ALL ON FUNCTION private.check_integration(text) FROM PUBLIC, anon, authenticated, service_role;

CREATE FUNCTION public.authorize_integration(p_token_hash text)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  SELECT private.check_integration(p_token_hash) - 'user_id';
$$;

CREATE FUNCTION public.process_integration_transaction(p_token_hash text, p_request_key uuid, p_values jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  authorization_result jsonb;
  owner_id uuid;
  normalized_values jsonb;
  fingerprint text;
  receipt private.integration_requests;
  saved_id uuid;
  amount_value double precision;
  date_value date;
BEGIN
  authorization_result := private.check_integration(p_token_hash);
  IF (authorization_result->>'status')::integer <> 200 THEN RETURN authorization_result; END IF;
  owner_id := (authorization_result->>'user_id')::uuid;

  -- Defensive checks also protect the privileged procedure from an invalid caller.
  IF p_request_key IS NULL OR p_values IS NULL OR jsonb_typeof(p_values) <> 'object'
     OR p_values - ARRAY['type','description','amount','category','date']::text[] <> '{}'::jsonb
     OR coalesce(p_values->>'type', '') NOT IN ('income','expense')
     OR jsonb_typeof(p_values->'description') IS DISTINCT FROM 'string'
     OR jsonb_typeof(p_values->'category') IS DISTINCT FROM 'string'
     OR jsonb_typeof(p_values->'amount') IS DISTINCT FROM 'number'
     OR jsonb_typeof(p_values->'date') IS DISTINCT FROM 'string'
     OR length(btrim(p_values->>'description')) = 0 OR length(btrim(p_values->>'category')) = 0
     OR p_values->>'date' !~ '^\d{4}-\d{2}-\d{2}$' THEN
    RETURN jsonb_build_object('status', 400, 'code', 'invalid_transaction', 'message', 'Invalid transaction fields.');
  END IF;
  BEGIN
    amount_value := (p_values->>'amount')::double precision;
    date_value := (p_values->>'date')::date;
    IF amount_value <= 0 OR amount_value IN ('NaN'::double precision, 'Infinity'::double precision)
       OR date_value::text <> p_values->>'date' THEN RAISE invalid_parameter_value; END IF;
  EXCEPTION WHEN invalid_text_representation OR datetime_field_overflow OR numeric_value_out_of_range OR invalid_parameter_value THEN
    RETURN jsonb_build_object('status', 400, 'code', 'invalid_transaction', 'message', 'Invalid amount or date.');
  END;
  normalized_values := jsonb_build_object('type', p_values->>'type', 'description', btrim(p_values->>'description'),
    'amount', amount_value, 'category', btrim(p_values->>'category'), 'date', date_value::text);
  fingerprint := encode(extensions.digest(normalized_values::text, 'sha256'), 'hex');
  -- check_integration holds the account's rate-limit row lock. Other requests
  -- from the same user wait here, even when they use different integration tokens.
  SELECT * INTO receipt FROM private.integration_requests WHERE user_id = owner_id AND request_key = p_request_key;
  IF FOUND THEN
    IF receipt.request_hash <> fingerprint THEN
      RETURN jsonb_build_object('status', 409, 'code', 'idempotency_conflict', 'message', 'This request ID was already used with different data.');
    END IF;
    RETURN jsonb_build_object('status', 200, 'transaction_id', receipt.transaction_id, 'duplicate', true);
  END IF;
  BEGIN
    INSERT INTO public.transactions(user_id, type, description, amount, category, date)
    VALUES (owner_id, (normalized_values->>'type')::public.transaction_type,
      normalized_values->>'description', amount_value, normalized_values->>'category', date_value)
    RETURNING id INTO saved_id;
    INSERT INTO private.integration_requests(user_id, request_key, request_hash, transaction_id)
    VALUES (owner_id, p_request_key, fingerprint, saved_id);
  EXCEPTION WHEN OTHERS THEN
    -- Both writes roll back together. Never echo database details to the caller.
    RETURN jsonb_build_object('status', 500, 'code', 'save_failed', 'message', 'Could not save the transaction. Retry with the same request ID.');
  END;
  RETURN jsonb_build_object('status', 201, 'transaction_id', saved_id, 'duplicate', false);
END;
$$;

REVOKE ALL ON FUNCTION public.authorize_integration(text),
  public.process_integration_transaction(text, uuid, jsonb) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.authorize_integration(text),
  public.process_integration_transaction(text, uuid, jsonb) TO service_role;
