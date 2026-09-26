-- LOCAL DEVELOPMENT ONLY. Apply with psql to 127.0.0.1:54322.
-- Do not put these anonymous write policies in migrations or seed files.

BEGIN;

GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON TYPE public.transaction_type TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO anon;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.transactions;
DROP POLICY IF EXISTS "Local anonymous read transactions" ON public.transactions;
DROP POLICY IF EXISTS "Local anonymous insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Local anonymous update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Local anonymous delete transactions" ON public.transactions;

CREATE POLICY "Local anonymous read transactions"
  ON public.transactions FOR SELECT TO anon USING (true);

CREATE POLICY "Local anonymous insert transactions"
  ON public.transactions FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Local anonymous update transactions"
  ON public.transactions FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Local anonymous delete transactions"
  ON public.transactions FOR DELETE TO anon USING (true);

COMMIT;
