# Supabase migrations

Run SQL migrations via one of:

1. **Supabase Dashboard** → SQL Editor → paste contents of `migrations/*.sql` → Run
2. **Supabase CLI** (if linked): `supabase db push` or `supabase migration up`

Migrations are applied in filename order (e.g. `20260227_create_ai_sessions.sql`).
