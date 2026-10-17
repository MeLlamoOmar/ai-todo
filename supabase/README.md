# Local Supabase with Google Auth

The app uses Supabase Auth with Google OAuth and PKCE. Each signed-in user can
only access their own transactions through Row Level Security (RLS).

## 1. Configure Google

In [Google Auth Platform](https://console.cloud.google.com/auth/overview), create
or select a project, configure branding and consent, and add your Google account
as a test user if the audience is external and the app is in testing mode.

Create an OAuth client with type **Web application**:

- Authorized JavaScript origin: `http://localhost:5173`
- Authorized redirect URI: `http://127.0.0.1:54321/auth/v1/callback`
- Required scopes: `openid`, `email`, and `profile`; no additional scopes.

Google returns to Supabase using the callback above. Supabase then redirects to
the app at `http://localhost:5173/auth`.

Follow the [official Google setup guide](https://supabase.com/docs/guides/auth/social-login/auth-google).

## 2. Configure local credentials

Create or update the ignored root `.env.local`:

```dotenv
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<local-publishable-key>
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=<google-client-id>
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET=<google-client-secret>
```

Only the URL and publishable key belong in the browser. Never prefix the Google
secret or an administrative Supabase key with `VITE_`, and never commit secrets.

The Supabase CLI must receive the Google variables too. From the project root,
export them from `.env.local` before starting it (use a trusted dotenv file with
shell-compatible values):

```bash
set -a
source .env.local
set +a
pnpm exec supabase start
```

Start Docker Desktop first. Get the local publishable key from
`pnpm exec supabase status` and put it in `.env.local`. Restart local Supabase
with `pnpm exec supabase stop` followed by `pnpm exec supabase start` after
changing provider configuration; do not use `--no-backup`.

## 3. Apply the ownership migration

For an existing local database, apply pending migrations without resetting data:

```bash
pnpm exec supabase migration up --local
```

The ownership migration preserves existing transactions with `user_id = NULL`.
These rows are hidden from app users. New transactions receive `auth.uid()`
automatically; the frontend does not choose their owner.

The migration removes the public read policy and local anonymous policies. The
retired `local-access.sql` must not be reapplied. RLS validates ownership on
reads, inserts, updates, and deletes, including attempts to change the owner.
Frontend route protection only controls navigation.

Avoid `supabase db reset` when preserving local data: it deletes transactions.
No hosted project needs to be changed for this setup.

## 4. Run and verify

```bash
pnpm dev
```

Open **http://localhost:5173** consistently. Vite uses a fixed port and fails
instead of silently changing it, which would invalidate the OAuth allowlist.
Sign in with Google, create a transaction, refresh, and sign out. A second
Google account should start with an empty dashboard and must not be able to
read or change the first account's transactions.

Supabase handles PKCE code exchange, token storage and automatic refresh. The
app checks JWT claims before displaying the dashboard, reacts to session
changes, and clears transaction state when the account changes. Sign out affects
the current browser session, leaving other devices signed in.

Run the app checks and SQL isolation tests:

```bash
pnpm test
pnpm lint
pnpm build
pnpm exec supabase test db
```

SQL test fixtures and mutations run inside a transaction that is rolled back.

If Google rejects the callback, check the exact redirect URI, allowed app return
URL, and test-user list. If code exchange fails, start a new sign-in in the same
browser; PKCE codes are single-use and need the original browser's verifier.
Missing credentials prevent testing the complete Google redirect flow.

## Siri and iOS Shortcuts

The app's **Integrations** page includes instructions for creating a device token
and setting up the shortcut. The new migrations preserve existing transactions.
The integration function validates its own opaque tokens; only that function has
`verify_jwt = false`.

After applying the local migrations, run the function in a separate terminal:

```bash
pnpm exec supabase functions serve integration-transactions
```

With the function running, `pnpm test:integrations:local` exercises the real local
API and concurrent requests. It requires Python 3 and `psql`, creates disposable
test users, and removes their fixtures afterward.
