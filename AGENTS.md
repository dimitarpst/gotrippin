# Agent rules

## Available MCPs

Three MCP servers are available and should be used proactively:

- **`user-shadcn`** — Browse, search and install shadcn components (`skeleton`, `spinner`, `alert`, `sonner`, etc.). Always check shadcn before writing custom UI primitives.
- **`user-context7`** — Fetch up-to-date library docs and code examples. Use when unsure about an API or checking for breaking changes.
- **`user-supabase`** — Query Supabase (schema, data, RLS, RPCs). Use to verify tables, inspect data, or check RLS policies without leaving the editor.

---

## Quick Start

**First steps:**

1. Read `TODO` — see current task (mark `☐` → `✔` when done)
2. Read `docs/next_steps.md` — roadmap and context
3. Read `docs/DEBUGGING_PATTERNS.md` — debugging patterns

**Project:** Monorepo (`apps/web` Next.js, `apps/backend` NestJS, `packages/core` shared). Auth via Supabase (`proxy.ts` handles redirects). Recent: `getAuthToken()` → `apps/web/src/lib/api/auth.ts`, date helpers → `@gotrippin/core`.

**Workflow:** Always double ask before coding. Get explicit approval ("yes implement it", "go ahead"). Mark todos complete in `TODO` when done.

**Cross-platform:** Design for web + mobile (React Native). Same data, same business logic, different UI. Keep platform-specific code in UI layer only. See `docs/BACKEND_FRONTEND_MOBILE_AUDIT.md` for current state.

---

**Todos & planning**

- When a task in the root `TODO` file is completed, always mark it there (change `☐` to `✔`) in addition to any internal tracking.
- Work on todos one-by-one: complete a task, verify/test it, then move to the next. User stays in control of the pace.

## Workflow & communication

- **Always double ask before coding.** Before implementing any code changes, discuss the approach, get explicit confirmation ("yes implement it", "go ahead", etc.), then proceed. Never code without explicit approval.
- **Precise and short responses.** Provide concise answers with essential info. Elaborate only if asked or if more detail is needed. Avoid overly detailed explanations unless requested.

**Complex bugs / debugging:** Read `docs/DEBUGGING_PATTERNS.md`. Use runtime logs, analyze timing, search for known issues (e.g. Supabase auth-js#762). When the user says "it doesn't work" again, change what you're instrumenting instead of repeating the same approach.

## Errors & behavior

- **No silent errors.** Do not swallow or ignore errors (no empty `catch`, no `.catch(() => {})` without logging or surfacing). Log and/or show or rethrow.
- **No fallbacks that hide failures.** Do not replace a failed result with a default and pretend success. Let the error be visible or captured (e.g. error state, toast, boundary).
- **Surface and capture.** Prefer: check `error` from Supabase calls (`{ data, error }`), handle it (message to user or `console.error`), and do not overwrite with generic success UI.
- **Next.js:** Use `error.js`/`error.tsx` (and root `global-error.js` if needed) for boundaries; log in `useEffect` and expose a reset. API routes: use try/catch, return proper status (e.g. 500 + message), avoid leaking sensitive detail.
- **Supabase:** Always check `error` after `rpc()`, `auth.signIn*`, `auth.updateUser`, etc. Handle and surface; do not assume success when `error` is set.
- **Never update UI optimistically on mutations.** Only update UI after the request succeeds (check `error` / response). Do not assume success; validate the response before reflecting changes.

## Cross-platform architecture

- **Same data, same behavior.** Business logic, validation, API calls, data models must work identically on web and mobile. Only UI layer differs.
- **Shared code in `@gotrippin/core`.** Types, schemas, utilities, date helpers, validation — all reusable.
- **API layer:** Both platforms call NestJS with Supabase JWT. No platform-specific API logic.
- **Platform-specific:** UI components, navigation, maps (different libraries), auth flows (redirects vs deep links).
- **Audit:** See `docs/BACKEND_FRONTEND_MOBILE_AUDIT.md` for current gaps and recommendations.

## Storage

- **No localStorage.** Prefer session-scoped state (`sessionStorage` on web where appropriate), cookies for auth, and secure storage on native. localStorage is per-device, doesn’t align with “same data everywhere” (web + mobile), and RN uses AsyncStorage. See `docs/BACKEND_FRONTEND_MOBILE_AUDIT.md`.
- **Supabase auth:** Use `@supabase/ssr` with cookie-based sessions so middleware can read them. No localStorage for auth.

## Auth & provider linking (minimal reference)

- **One user, many identities.** Single Supabase user; `user.identities` is source of truth. Key files: `AuthContext.tsx`, `LinkedAccountsCard.tsx`, `app/user/page.tsx`, `UserProfile.tsx`.
- **No localStorage for auth.** Use Supabase only. “Has password?” → RPC `get_my_has_password()`. Email identity after add-password → RPC `ensure_email_identity()` (then refresh session / optional re-login).
- **Unlink Google** only when `signup_provider === 'email'`. Never when created with Google. i18n keys: `unlink_google_created_with_google`, `unlink_account_last_provider`, `unlink_google_requires_email_signin`.
- **Add-password flow:** Update UI (success, clear form) first; run `ensure_email_identity`, `refreshSession`, optional `signInWithPassword`, then `refreshProfile` in the background so UI never blocks on RPC/auth.
