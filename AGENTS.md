# Agent rules

Read `docs/next_steps.md` for roadmap and task context.

**Todos & planning**

- When a task in the root `TODO` file is completed, always mark it there (change `☐` to `✔`) in addition to any internal tracking.

**Complex bugs / debugging:** Read `docs/DEBUGGING_PATTERNS.md`. Use runtime logs, analyze timing, search for known issues (e.g. Supabase auth-js#762). When the user says "it doesn't work" again, change what you're instrumenting instead of repeating the same approach.

## Errors & behavior

- **No silent errors.** Do not swallow or ignore errors (no empty `catch`, no `.catch(() => {})` without logging or surfacing). Log and/or show or rethrow.
- **No fallbacks that hide failures.** Do not replace a failed result with a default and pretend success. Let the error be visible or captured (e.g. error state, toast, boundary).
- **Surface and capture.** Prefer: check `error` from Supabase calls (`{ data, error }`), handle it (message to user or `console.error`), and do not overwrite with generic success UI.
- **Next.js:** Use `error.js`/`error.tsx` (and root `global-error.js` if needed) for boundaries; log in `useEffect` and expose a reset. API routes: use try/catch, return proper status (e.g. 500 + message), avoid leaking sensitive detail.
- **Supabase:** Always check `error` after `rpc()`, `auth.signIn*`, `auth.updateUser`, etc. Handle and surface; do not assume success when `error` is set.
- **Never update UI optimistically on mutations.** Only update UI after the request succeeds (check `error` / response). Do not assume success; validate the response before reflecting changes.

## Auth & provider linking (minimal reference)

- **One user, many identities.** Single Supabase user; `user.identities` is source of truth. Key files: `AuthContext.tsx`, `LinkedAccountsCard.tsx`, `app/user/page.tsx`, `UserProfile.tsx`.
- **No localStorage for auth.** Use Supabase only. “Has password?” → RPC `get_my_has_password()`. Email identity after add-password → RPC `ensure_email_identity()` (then refresh session / optional re-login).
- **Unlink Google** only when `signup_provider === 'email'`. Never when created with Google. i18n keys: `unlink_google_created_with_google`, `unlink_account_last_provider`, `unlink_google_requires_email_signin`.
- **Add-password flow:** Update UI (success, clear form) first; run `ensure_email_identity`, `refreshSession`, optional `signInWithPassword`, then `refreshProfile` in the background so UI never blocks on RPC/auth.
