BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET search_path = public, extensions;
SELECT no_plan();

INSERT INTO auth.users(id, email) VALUES
  ('50000000-0000-4000-8000-000000000001', 'integration-alice@example.invalid'),
  ('50000000-0000-4000-8000-000000000002', 'integration-bob@example.invalid');
CREATE TEMP TABLE integration_fixtures(name text PRIMARY KEY, credential jsonb);
GRANT SELECT, INSERT ON integration_fixtures TO authenticated, service_role;
CREATE FUNCTION pg_temp.token_hash(p_name text) RETURNS text LANGUAGE sql STABLE AS $$
  SELECT encode(extensions.digest(credential->>'token', 'sha256'), 'hex')
  FROM integration_fixtures WHERE name = p_name;
$$;

SELECT ok(NOT has_schema_privilege('anon', 'private', 'USAGE'), 'Anonymous clients cannot access the private schema');
SELECT ok(NOT has_schema_privilege('authenticated', 'private', 'USAGE'), 'Signed-in clients cannot access token hashes');
SELECT ok(NOT has_table_privilege('service_role', 'public.transactions', 'INSERT'), 'Backend was not granted general transaction insert access');
SELECT ok(NOT has_function_privilege('anon', 'public.create_integration(text)', 'EXECUTE'), 'Anonymous clients cannot issue tokens');
SELECT ok(NOT has_function_privilege('authenticated', 'public.authorize_integration(text)', 'EXECUTE'), 'Users cannot invoke the backend authorization procedure');
SELECT ok(NOT has_function_privilege('authenticated', 'public.process_integration_transaction(text,uuid,jsonb)', 'EXECUTE'), 'Users cannot invoke the privileged insert procedure');

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '';
SELECT throws_ok($$SELECT public.create_integration('No owner')$$, '42501', NULL, 'Issuance requires an authenticated identity');
SET LOCAL request.jwt.claim.sub = '50000000-0000-4000-8000-000000000001';
INSERT INTO integration_fixtures VALUES ('alice', public.create_integration('  Personal iPhone  ')), ('alice2', public.create_integration('iPad'));
SELECT ok((SELECT credential->>'token' ~ '^it_[0-9a-f]{64}$' FROM integration_fixtures WHERE name = 'alice'), 'Token has 256 random bits and the expected format');
SELECT is((SELECT credential->>'name' FROM integration_fixtures WHERE name = 'alice'), 'Personal iPhone', 'Names are normalized');
SELECT is((SELECT (credential->>'expires_at')::timestamptz - (credential->>'created_at')::timestamptz FROM integration_fixtures WHERE name = 'alice'), interval '90 days', 'Expiry is fixed to 90 days');
SELECT is((SELECT count(*) FROM public.list_integrations()), 2::bigint, 'A user can have multiple integrations');
SELECT ok(NOT (SELECT to_jsonb(i) ? 'token' OR to_jsonb(i) ? 'token_hash' FROM public.list_integrations() i LIMIT 1), 'Listing never returns a token or hash');
SELECT throws_ok($$SELECT public.create_integration(' ')$$, '22023', NULL, 'Blank names are rejected');
SELECT public.create_integration('Extra 1') IS NOT NULL AS ignored_issue_1 \gset
SELECT public.create_integration('Extra 2') IS NOT NULL AS ignored_issue_2 \gset
SELECT public.create_integration('Extra 3') IS NOT NULL AS ignored_issue_3 \gset
SELECT throws_ok($$SELECT public.create_integration('Extra 4')$$, '22023', NULL, 'At most five active tokens are issued');

SET LOCAL request.jwt.claim.sub = '50000000-0000-4000-8000-000000000002';
SELECT is((SELECT count(*) FROM public.list_integrations()), 0::bigint, 'Bob cannot list Alice integrations');
SELECT is(public.revoke_integration((SELECT (credential->>'id')::uuid FROM integration_fixtures WHERE name = 'alice')), false, 'Bob cannot revoke Alice integration');
INSERT INTO integration_fixtures VALUES ('bob', public.create_integration('Bob iPhone'));

RESET ROLE;
SELECT ok((SELECT token_hash = pg_temp.token_hash('alice') AND token_hash <> f.credential->>'token'
  FROM private.integration_tokens t JOIN integration_fixtures f ON t.id = (f.credential->>'id')::uuid WHERE f.name = 'alice'), 'Only a hash is stored');
INSERT INTO private.integration_tokens(user_id, name, token_hash, created_at, expires_at, revoked_at, scopes) VALUES
  ('50000000-0000-4000-8000-000000000001', 'Expired', repeat('1',64), now() - interval '2 days', now() - interval '1 day', NULL, ARRAY['transactions:create']),
  ('50000000-0000-4000-8000-000000000001', 'Revoked', repeat('2',64), now(), now() + interval '1 day', now(), ARRAY['transactions:create']),
  ('50000000-0000-4000-8000-000000000001', 'No scope', repeat('3',64), now(), now() + interval '1 day', NULL, ARRAY[]::text[]);

SET LOCAL ROLE service_role;
SELECT is(public.authorize_integration(repeat('0',64))->>'status', '401', 'Unknown tokens are rejected');
SELECT is(public.authorize_integration(repeat('1',64))->>'status', '401', 'Expired tokens are rejected');
SELECT is(public.authorize_integration(repeat('2',64))->>'status', '401', 'Revoked tokens are rejected');
SELECT is(public.authorize_integration(repeat('3',64))->>'status', '403', 'Create scope is required');
SELECT is(public.authorize_integration(pg_temp.token_hash('alice'))->>'status', '200', 'The server can authorize an active token');
SELECT ok(NOT public.authorize_integration(pg_temp.token_hash('alice')) ? 'user_id', 'Catalog authorization does not disclose the owner');

INSERT INTO integration_fixtures VALUES ('first_receipt', public.process_integration_transaction(pg_temp.token_hash('alice'), '60000000-0000-4000-8000-000000000001',
  '{"type":"expense","description":" Lunch ","amount":350.50,"category":"Food","date":"2026-10-17"}'));
SELECT is((SELECT credential->>'status' FROM integration_fixtures WHERE name = 'first_receipt'), '201', 'A valid request creates a transaction');
SELECT is(public.process_integration_transaction(pg_temp.token_hash('alice2'), '60000000-0000-4000-8000-000000000001',
  '{"type":"expense","description":"Lunch","amount":350.5,"category":"Food","date":"2026-10-17"}')->>'status', '200', 'Equivalent retry is deduplicated across tokens for one account');
SELECT is(public.process_integration_transaction(pg_temp.token_hash('alice'), '60000000-0000-4000-8000-000000000001',
  '{"type":"expense","description":"Different","amount":350.5,"category":"Food","date":"2026-10-17"}')->>'status', '409', 'Conflicting reuse is rejected');
SELECT is(public.process_integration_transaction(pg_temp.token_hash('alice'), gen_random_uuid(),
  '{"type":"expense","description":"Bad","amount":0,"category":"Food","date":"2026-10-17"}')->>'status', '400', 'Zero amounts are rejected in SQL too');
SELECT is(public.process_integration_transaction(pg_temp.token_hash('alice'), gen_random_uuid(),
  '{"type":"expense","description":"Bad","amount":1,"category":"Food","date":"2026-02-30"}')->>'status', '400', 'Impossible dates are rejected in SQL too');
SELECT is(public.process_integration_transaction(pg_temp.token_hash('alice'), gen_random_uuid(),
  '{"type":"expense","description":"Bad","amount":1,"category":"Food","date":"2026-10-17","user_id":"50000000-0000-4000-8000-000000000002"}')->>'status', '400', 'Caller-supplied ownership is rejected');
SELECT is(public.process_integration_transaction(pg_temp.token_hash('bob'), '60000000-0000-4000-8000-000000000001',
  '{"type":"income","description":"Salary","amount":1000,"category":"Salary","date":"2026-10-17"}')->>'status', '201', 'Different accounts may use the same operation ID');

RESET ROLE;
SELECT is((SELECT user_id FROM public.transactions WHERE id = (SELECT (credential->>'transaction_id')::uuid FROM integration_fixtures WHERE name = 'first_receipt')),
  '50000000-0000-4000-8000-000000000001'::uuid, 'The owner comes from the validated integration');
SELECT is((SELECT count(*) FROM public.transactions WHERE user_id = '50000000-0000-4000-8000-000000000001'), 1::bigint, 'Retries did not create a second transaction');
SELECT ok((SELECT last_used_at IS NOT NULL FROM private.integration_tokens WHERE id = (SELECT (credential->>'id')::uuid FROM integration_fixtures WHERE name = 'alice')), 'Usage metadata is updated');
DELETE FROM public.transactions WHERE user_id = '50000000-0000-4000-8000-000000000001';
SET LOCAL ROLE service_role;
SELECT is(public.process_integration_transaction(pg_temp.token_hash('alice'), '60000000-0000-4000-8000-000000000001',
  '{"type":"expense","description":"Lunch","amount":350.5,"category":"Food","date":"2026-10-17"}')->>'status', '200', 'A deleted transaction keeps its receipt');
RESET ROLE;
SELECT is((SELECT count(*) FROM public.transactions WHERE user_id = '50000000-0000-4000-8000-000000000001'), 0::bigint, 'Retry does not recreate a deleted transaction');

-- Force the second write to fail and prove that the first one rolls back too.
ALTER TABLE private.integration_requests ADD CONSTRAINT fail_test_receipt
  CHECK (request_key <> '60000000-0000-4000-8000-000000000099'::uuid);
SET LOCAL ROLE service_role;
SELECT is(public.process_integration_transaction(pg_temp.token_hash('alice'), '60000000-0000-4000-8000-000000000099',
  '{"type":"expense","description":"Atomic write test","amount":1,"category":"Food","date":"2026-10-17"}')->>'status', '500', 'A failed receipt write returns a safe retryable error');
RESET ROLE;
SELECT is((SELECT count(*) FROM public.transactions WHERE user_id = '50000000-0000-4000-8000-000000000001'), 0::bigint, 'Receipt failure rolls back the transaction insert');
SELECT is((SELECT count(*) FROM private.integration_requests WHERE user_id = '50000000-0000-4000-8000-000000000001' AND request_key = '60000000-0000-4000-8000-000000000099'), 0::bigint, 'Failed writes leave no successful receipt');
ALTER TABLE private.integration_requests DROP CONSTRAINT fail_test_receipt;
SET LOCAL ROLE service_role;
SELECT is(public.process_integration_transaction(pg_temp.token_hash('alice'), '60000000-0000-4000-8000-000000000099',
  '{"type":"expense","description":"Atomic write test","amount":1,"category":"Food","date":"2026-10-17"}')->>'status', '201', 'The same operation can succeed after the write failure is resolved');
RESET ROLE;

UPDATE private.integration_rate_limits SET request_count = 29, window_start = date_trunc('minute',clock_timestamp()) WHERE user_id = '50000000-0000-4000-8000-000000000001';
SET LOCAL ROLE service_role;
SELECT is(public.authorize_integration(pg_temp.token_hash('alice'))->>'status', '200', 'The thirtieth request is allowed');
SELECT is(public.authorize_integration(pg_temp.token_hash('alice2'))->>'status', '429', 'The limit is shared across integrations');
RESET ROLE;
SELECT is((SELECT request_count FROM private.integration_rate_limits WHERE user_id = '50000000-0000-4000-8000-000000000001'), 31, 'Denied requests commit the bounded counter');
UPDATE private.integration_rate_limits SET window_start = now() - interval '2 minutes' WHERE user_id = '50000000-0000-4000-8000-000000000001';
SET LOCAL ROLE service_role;
SELECT is(public.authorize_integration(pg_temp.token_hash('alice'))->>'status', '200', 'A later window resets the counter');
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '50000000-0000-4000-8000-000000000001';
SELECT is(public.revoke_integration((SELECT (credential->>'id')::uuid FROM integration_fixtures WHERE name = 'alice')), true, 'Owner can revoke a token');
SELECT is(public.revoke_integration((SELECT (credential->>'id')::uuid FROM integration_fixtures WHERE name = 'alice')), true, 'Revocation is idempotent');
SET LOCAL ROLE service_role;
SELECT is(public.authorize_integration(pg_temp.token_hash('alice'))->>'status', '401', 'Revocation is enforced by the backend');
RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
