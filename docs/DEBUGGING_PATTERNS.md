# Debugging Patterns — Heuristics for Common Bugs

> When a user describes a bug in a certain way, these patterns help identify the cause quickly.

---

## Pattern: "Nothing in network tab" / "Click does nothing"

### User description (typical)

- "I click the button and **nothing happens**"
- "**No network requests** when I click"
- "Works after **Ctrl+Shift+R** (hard refresh) but not on first visit"
- "Works sometimes, not others"
- "The whole page is broken" (multiple buttons unresponsive)

### What it usually is

**Mount race / effect ordering.** The page or a child component is rendering and attaching event handlers while `useEffect` hooks are running heavy work (API calls, auth updates, state changes). That can interfere with React’s render/commit phase so that:

1. Event handlers never get attached
2. Clicks fire but handlers see stale or wrong state
3. A cascade of updates causes re-mounts and handlers get lost

### Why hard refresh “fixes” it

On hard refresh, the app mounts from scratch. Auth/session are stable before the page renders. Effects run in a predictable order. No race. So everything works.

### Where to look

1. **Heavy `useEffect`s on mount** – e.g. `updateUser`, `getSession`, RPCs, profile fetch.
2. **Client navigation** – Bug only when navigating from another page (not on direct load or refresh).
3. **Auth / profile flows** – Pages that load right after login or that touch session/profile state.
4. **Children with effects** – Especially cards/panels that run auth or profile logic as soon as they mount.

### Fixes

| Fix | When to use |
|-----|-------------|
| **Mounted gate** | `const [mounted, setMounted] = useState(false); useEffect(() => setMounted(true), []);` – Don’t render interactive content until `mounted`. Good for hydration/race issues. |
| **Defer effects** | Wrap heavy effect logic in `setTimeout(..., 150–200)` – Give React time to finish mount and attach handlers before doing auth/API work. |
| **Move side effects out of `useMemo`** | `useMemo` must be pure. Side effects (API, `updateUser`, etc.) belong in `useEffect`. |
| **Stable refs for callbacks** | If an effect calls a callback that changes every render, use `useRef` so the effect doesn’t re-run unnecessarily and cause cascades. |

### Real example (Profile page) — fixed Feb 2026

**Symptoms:** Logout, edit, save did nothing on first visit after login; no network activity on click; worked after hard refresh.

**Cause:** `LinkedAccountsCard` ran `updateUser` and `get_my_has_password` in `useEffect` immediately on mount. That triggered auth updates and re-renders during the initial commit. Handlers for logout and other buttons never reliably attached.

**Fixes applied:**
- User page: single profiles update (no `updateUser`); streamlined loading; timeout handling
- `LinkedAccountsCard`: deferred heavy auth effects (e.g. `requestIdleCallback` or setTimeout) — waits for browser idle
- Profile save: use `profiles` table only; avoid `auth.updateUser` for profile data

---

## Pattern: "Save times out" / "Second save sticks"

### Symptoms

- First save works, second save hangs or times out
- "Saving..." never goes away
- Profile edit/save becomes unresponsive after one successful save

### Cause

**Supabase `auth.updateUser()` blocks/hangs** when run alongside profiles table updates. It competes for the same session and can stall indefinitely.

### Fix

- **Do not use `updateUser` for profile data.** Store `display_name` (and other profile fields) in the `profiles` table only. Use one profiles update for everything.
- Merge `display_name` from profiles into `ExtendedUser` in `loadUserWithProfile`.
- Defer `refreshProfile` (e.g. `requestIdleCallback`) so it doesn’t overlap with the profiles update.

---

## Heuristic

> **If the user says: "nothing in network tab" or "clicks don't work" or "only works after refresh" → think mount race / effect ordering. Check for heavy effects on mount and add a mounted gate or defer.**

> **If profile save times out or second save sticks → avoid `updateUser` for profile data. Use profiles table only, defer `refreshProfile`.**

> **If logout/buttons "don't work" but clicks do fire (proven by logs) → `supabase.auth.signOut()` is hanging. Don't await it; clear session first, fire signOut in background, return immediately so redirect can run.**

---

## Pattern: "Works at first, then stops after a few minutes" / "Half logout"

### User description (typical)

- "Save works, I wait a minute or two, then it **stops working**"
- "I click logout but **I don't actually get logged out** – I'm sent somewhere but still 'logged in'"
- "Going back to profile, Save works again – like something reset"
- "**No logs** when I click Save" (button disabled or handler never runs)

### What it usually is

**Supabase `onAuthStateChange` deadlock (auth-js#762).** The `onAuthStateChange` callback must never `await` any Supabase call. If it does, Supabase's internal lock is held and *all* subsequent Supabase calls (getSession, from().update(), etc.) hang indefinitely. This happens when:

1. Token auto-refreshes (~1–2 min idle) → Supabase emits `SIGNED_IN` or `TOKEN_REFRESHED`
2. Our callback runs `await loadUserWithProfile()` → Supabase DB call inside the callback
3. Lock held → any other Supabase call (e.g. profiles update in handleSave) hangs

### Why "half logout" seems to fix it

`resetClientSession` + navigation gives a fresh JS context. The stuck lock is gone. Save works again. But the cookie wasn't cleared yet (signOut runs in background), so the user still appears logged in.

### Fix

**Never `await` Supabase inside `onAuthStateChange`.** Defer all Supabase work with `setTimeout(0)` so it runs *after* the callback returns:

```js
supabase.auth.onAuthStateChange((event, session) => {
  // Sync-only work here; no await on Supabase
  setAccessToken(session?.access_token ?? null);
  setTimeout(() => {
    loadUserWithProfile(session?.user ?? null).catch(console.error);
  }, 0);
});
```

`setTimeout(0)` is the standard JS way to defer to the next event loop tick – not a magic timeout.

### Also avoid

- `await supabase.auth.getSession()` at the start of user actions – it can hang in the same lock state. Remove it from hot paths; Supabase uses the session automatically for DB calls.

---

## Agent: Debugging complex bugs

When a bug is complex or the user says "it doesn't work" repeatedly:

1. **Use runtime evidence.** Add instrumentation logs and read the logs before concluding anything. Don't fix from code inspection alone.
2. **Pay attention to timing.** When does it break? (e.g. after 1–2 min idle) What changes? (e.g. `SIGNED_IN` event) Log timestamps and correlate.
3. **Don't re-instrument the same way.** If the user already said "nothing in logs" or "same thing happens again", the previous instrumentation missed the real path. Change what you log or where.
4. **Search for known issues.** Supabase auth has documented pitfalls (auth-js#762, #1594). Search: "Supabase [symptom]" or "Supabase onAuthStateChange" before adding more custom logic.
5. **Remove speculative fixes.** If logs reject a hypothesis, revert the code changes for that hypothesis. Don't accumulate guards and timeouts.
