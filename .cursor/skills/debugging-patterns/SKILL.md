---
name: debugging-patterns
description: Applies heuristics for common Go Trippin bugs: mount races, Supabase auth deadlocks, profile save timeouts. Use when debugging "nothing in network tab", "click does nothing", "only works after refresh", "save times out", or "half logout".
---

# Debugging Patterns

## Heuristic 1: "Nothing in network tab" / "Click does nothing"

**Cause:** Mount race / effect ordering. Heavy `useEffect`s on mount (API, `updateUser`, RPCs, profile fetch) run while React is attaching handlers. Handlers never attach or see stale state.

**Where to look:**
- Heavy `useEffect`s on mount (e.g. `LinkedAccountsCard`, `updateUser`, `get_my_has_password`)
- Bug only when navigating from another page (not on direct load/refresh)
- Auth/profile flows

**Fixes:**
| Fix | When |
|-----|------|
| Mounted gate | `const [mounted, setMounted] = useState(false); useEffect(() => setMounted(true), []);` – Don't render interactive content until mounted. |
| Defer effects | `requestIdleCallback` or `setTimeout(..., 150–200)` – Let React finish mount before auth/API work. |
| Move side effects out of `useMemo` | Side effects belong in `useEffect`. |
| Stable refs for callbacks | Use `useRef` so effect doesn't re-run and cause cascades. |
| Plain `<button>` instead of `motion.button` | Avoids Framer Motion during mount. |

---

## Heuristic 2: "Save times out" / "Second save sticks"

**Cause:** `supabase.auth.updateUser()` blocks when run alongside profiles table updates. Same session lock.

**Fix:**
- **Do not use `updateUser` for profile data.** Store `display_name` in `profiles` table only.
- Merge `display_name` from profiles into `ExtendedUser` in `loadUserWithProfile`.
- Defer `refreshProfile` (e.g. `requestIdleCallback`) so it doesn't overlap with profiles update.

---

## Heuristic 3: "Works at first, then stops" / "Half logout"

**Cause:** Supabase `onAuthStateChange` deadlock (auth-js#762). Callback must never `await` any Supabase call. If it does, all subsequent Supabase calls hang.

**Fix:** Never `await` Supabase inside `onAuthStateChange`. Defer work with `setTimeout(0)`:

```js
supabase.auth.onAuthStateChange((event, session) => {
  setAccessToken(session?.access_token ?? null);
  setTimeout(() => {
    loadUserWithProfile(session?.user ?? null).catch(console.error);
  }, 0);
});
```

Also avoid `await supabase.auth.getSession()` at the start of user actions – it can hang in the same lock state.

---

## Heuristic 4: Logout/buttons "don't work" but clicks fire

**Cause:** `supabase.auth.signOut()` is hanging. Don't await it; clear session first, fire signOut in background, return immediately so redirect can run.

---

## Complex bugs: use runtime evidence

1. Add instrumentation logs; read logs before concluding.
2. Pay attention to timing (e.g. after 1–2 min idle).
3. If same instrumentation misses the path, change what/where you log.
4. Search for known issues: "Supabase [symptom]", "Supabase onAuthStateChange", auth-js#762, #1594.
5. If logs reject a hypothesis, revert those code changes. Don't accumulate guards/timeouts.

## Full reference

See `docs/DEBUGGING_PATTERNS.md` for full details and examples.
