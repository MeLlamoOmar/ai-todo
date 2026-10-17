-- Existing rows deliberately remain unassigned and inaccessible to app users.
ALTER TABLE public.transactions
  ADD COLUMN user_id uuid REFERENCES auth.users(id);

ALTER TABLE public.transactions
  ALTER COLUMN user_id SET DEFAULT auth.uid();

CREATE INDEX transactions_user_id_idx ON public.transactions(user_id);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON public.transactions;
DROP POLICY IF EXISTS "Local anonymous read transactions" ON public.transactions;
DROP POLICY IF EXISTS "Local anonymous insert transactions" ON public.transactions;
DROP POLICY IF EXISTS "Local anonymous update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Local anonymous delete transactions" ON public.transactions;

REVOKE ALL ON public.transactions FROM anon, authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON TYPE public.transaction_type TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;

CREATE POLICY "Users read own transactions"
  ON public.transactions FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users insert own transactions"
  ON public.transactions FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users update own transactions"
  ON public.transactions FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users delete own transactions"
  ON public.transactions FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);
