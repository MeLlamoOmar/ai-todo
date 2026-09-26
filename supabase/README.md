# Local Supabase setup

This app currently supports **local Supabase only**. Do not apply
`local-access.sql` to a hosted project: it allows unauthenticated clients to
read and change every transaction.

1. Start Docker and run `pnpm exec supabase start`.
2. Keep the local API URL and publishable key in the ignored root `.env.local`:
   `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Get the current
   values with `pnpm exec supabase status`.
3. Apply the local-only permissions and policies from the project root:

   ```bash
   PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres \
     -v ON_ERROR_STOP=1 -f supabase/local-access.sql
   ```

4. Run `pnpm dev` and open the app. Transactions are now stored in the local
   database and remain after refreshing the page.

Run step 3 again after `supabase db reset`, which rebuilds the local database
and removes these local-only policies. A reset also deletes local transaction
data. The access file is intentionally outside `supabase/migrations/` and
`supabase/seed.sql`, so `supabase db push` will not deploy it to the hosted
project. Authentication and per-user policies are needed before connecting a
deployed app to Supabase.
