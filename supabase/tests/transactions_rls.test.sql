BEGIN;
CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET search_path = public, extensions;

SELECT plan(21);

-- All fixtures and changes are rolled back, including test users.
INSERT INTO auth.users (id, email) VALUES
  ('10000000-0000-4000-8000-000000000001', 'rls-alice@example.invalid'),
  ('10000000-0000-4000-8000-000000000002', 'rls-bob@example.invalid');

INSERT INTO public.transactions (id, user_id, type, description, amount, category, date) VALUES
  ('20000000-0000-4000-8000-000000000001', NULL, 'income', 'Unassigned fixture', 10, 'Other', '2026-10-11'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'income', 'Alice fixture', 20, 'Other', '2026-10-11'),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', 'income', 'Bob fixture', 30, 'Other', '2026-10-11');

SET LOCAL ROLE anon;
SELECT throws_ok($$SELECT * FROM public.transactions$$, '42501', NULL, 'Anonymous reads are denied');
SELECT throws_ok($$INSERT INTO public.transactions (type, description, amount, category, date) VALUES ('income', 'Denied', 1, 'Other', '2026-10-11')$$, '42501', NULL, 'Anonymous inserts are denied');
SELECT throws_ok($$UPDATE public.transactions SET amount = 99$$, '42501', NULL, 'Anonymous updates are denied');
SELECT throws_ok($$DELETE FROM public.transactions$$, '42501', NULL, 'Anonymous deletes are denied');

RESET ROLE;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = '10000000-0000-4000-8000-000000000001';

SELECT results_eq($$SELECT id FROM public.transactions ORDER BY id$$, $$VALUES ('20000000-0000-4000-8000-000000000002'::uuid)$$, 'Alice only sees her own row');
SELECT is_empty($$SELECT id FROM public.transactions WHERE user_id IS NULL$$, 'Unassigned rows are hidden');
SELECT results_eq($$INSERT INTO public.transactions (id, type, description, amount, category, date) VALUES ('20000000-0000-4000-8000-000000000004', 'expense', 'New Alice fixture', 5, 'Other', '2026-10-11') RETURNING user_id$$, $$VALUES ('10000000-0000-4000-8000-000000000001'::uuid)$$, 'Inserts get the current user automatically');
SELECT throws_ok($$INSERT INTO public.transactions (user_id, type, description, amount, category, date) VALUES ('10000000-0000-4000-8000-000000000002', 'income', 'Denied', 1, 'Other', '2026-10-11')$$, '42501', NULL, 'Cannot create a row owned by Bob');
SELECT throws_ok($$INSERT INTO public.transactions (user_id, type, description, amount, category, date) VALUES (NULL, 'income', 'Denied', 1, 'Other', '2026-10-11')$$, '42501', NULL, 'New rows cannot be unassigned');
SELECT results_eq($$UPDATE public.transactions SET amount = 21 WHERE id = '20000000-0000-4000-8000-000000000002' RETURNING amount$$, $$VALUES (21::double precision)$$, 'Alice can update her own row');
SELECT throws_ok($$UPDATE public.transactions SET user_id = '10000000-0000-4000-8000-000000000002' WHERE id = '20000000-0000-4000-8000-000000000002'$$, '42501', NULL, 'Alice cannot transfer ownership');
SELECT throws_ok($$UPDATE public.transactions SET user_id = NULL WHERE id = '20000000-0000-4000-8000-000000000002'$$, '42501', NULL, 'Alice cannot remove ownership');
SELECT is_empty($$UPDATE public.transactions SET amount = 99 WHERE id = '20000000-0000-4000-8000-000000000003' RETURNING id$$, 'Alice cannot update Bob rows');
SELECT is_empty($$DELETE FROM public.transactions WHERE id = '20000000-0000-4000-8000-000000000003' RETURNING id$$, 'Alice cannot delete Bob rows');
SELECT is_empty($$UPDATE public.transactions SET user_id = '10000000-0000-4000-8000-000000000001' WHERE id = '20000000-0000-4000-8000-000000000001' RETURNING id$$, 'Alice cannot claim an unassigned row');
SELECT results_eq($$DELETE FROM public.transactions WHERE id = '20000000-0000-4000-8000-000000000004' RETURNING id$$, $$VALUES ('20000000-0000-4000-8000-000000000004'::uuid)$$, 'Alice can delete her own row');

SET LOCAL request.jwt.claim.sub = '10000000-0000-4000-8000-000000000002';
SELECT results_eq($$SELECT id FROM public.transactions ORDER BY id$$, $$VALUES ('20000000-0000-4000-8000-000000000003'::uuid)$$, 'Bob only sees his own row');
SELECT results_eq($$SELECT amount FROM public.transactions WHERE id = '20000000-0000-4000-8000-000000000003'$$, $$VALUES (30::double precision)$$, 'Bob row survived forbidden writes');
SELECT is_empty($$UPDATE public.transactions SET amount = 99 WHERE id = '20000000-0000-4000-8000-000000000002' RETURNING id$$, 'Bob cannot update Alice rows');
SELECT is_empty($$DELETE FROM public.transactions WHERE id = '20000000-0000-4000-8000-000000000002' RETURNING id$$, 'Bob cannot delete Alice rows');

RESET ROLE;
SELECT results_eq($$SELECT amount FROM public.transactions WHERE id = '20000000-0000-4000-8000-000000000001' AND user_id IS NULL$$, $$VALUES (10::double precision)$$, 'Unassigned row remains intact');

SELECT * FROM finish();
ROLLBACK;
