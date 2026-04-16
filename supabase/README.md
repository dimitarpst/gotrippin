# Supabase migrations

Run SQL migrations via one of:

1. **Supabase Dashboard** → SQL Editor → paste contents of `migrations/*.sql` → Run
2. **Supabase CLI** (if linked): `supabase db push` or `supabase migration up`

Migrations are applied in filename order (e.g. `20260227_create_ai_sessions.sql`).

Recent themes in tracked migrations (check filenames on `main` for the exact set): AI sessions and usage caps, trip gallery, notes, trip expenses/budget, trip member visibility fixes, **Google Places–related columns** on trip locations, etc. If you add SQL locally, commit it here so staging/production stay aligned with the app code.
