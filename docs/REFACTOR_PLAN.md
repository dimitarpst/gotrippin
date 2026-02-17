# Go Trippin' Refactor Plan

> Living document. Update as decisions are made.

---

## Goals (from discussion)

1. **Strong base** — Portfolio-quality, scalable. Not shipping soon; 1.5–2 months to do it right.

2. **Reusability** — Every element separate and reusable. No filler. Common items (buttons, etc.) reused everywhere.

3. **Maps & routes** — Routes are central. Want real coordinates from maps, not just names. Coordinates fix weather API (Bulgarian names break it), enable AI search, and make routes meaningful. Maps integration is next major feature.

4. **Mobile-ready** — Easy to convert to APK (React Native). NestJS exists so **all API logic** (auth, trips, search, etc.) lives there. Web frontend must NOT hold business logic that would need duplicating in mobile. Both web and mobile call NestJS.

5. **Collaboration & sync** — Web and mobile must sync. Common backend (NestJS) makes that possible. Both clients hit the same API.

6. **Structure over quick wins** — Fix structural mistakes (e.g. client instead of server components). Build so future work (maps, AI, mobile) is straightforward.

---

## Architecture Principles

| Principle | Meaning |
|-----------|---------|
| **NestJS = single API** | All reads and writes go through NestJS. Server Components fetch from NestJS. No direct Supabase calls from frontend for business logic. |
| **No logic in frontend** | Auth, validation, trip logic—lives in NestJS. Frontend calls API. Reusable by React Native. |
| **Server Components for reads** | Pages fetch data on server, pass to Client Components. Less client JS, faster first paint. |
| **Client Components for interactivity** | Forms, clicks, modals, filters—stay client. |

---

## Open Decisions (simplified)

*To be filled as we discuss.*

1. **What to remove?** — ✅ Done. TestQueries, ProfileFormExample, TripFormExample, calendar-05 (kept calendar.tsx).

2. **Auth flow / shared trip links** — ✅ Decision (Feb 2026): Per-trip visibility toggle — Private (auth required) vs Anyone with link (view without login). Deferred to Phase 5 — see TODO. Need Supabase server-side session for Server Components (current Phase 2).

3. **Bugs** — Fix forgot password + Google linking as part of refactor, or explicitly later?

4. **Phasing** — Incremental (one page at a time) vs batch refactor?

---

## Profile Page Bug Fix (Feb 2025–2026)

**Issue:** After login (especially Google), profile page was broken — logout, edit, save didn't work until Ctrl+Shift+R.

**Root cause:** Race between page mount and auth/session state. LinkedAccountsCard's effects (updateUser, get_my_has_password) ran immediately on mount and could interfere with React's commit phase and event handler attachment.

**Changes applied:**
- `app/user/page.tsx`: Single profiles update (no `updateUser` for profile data); timeout handling; streamlined loading.
- `LinkedAccountsCard.tsx`: Deferred heavy effects (updateUser, get_my_has_password) to avoid mount race.
- Profile save: Use `profiles` table only for display_name, avatar_color, avatar_url; avoid `auth.updateUser` during save.

**Status:** ✅ Fixed (Feb 2026). The race is gone.

---

## Phase Outline (draft)

- **Phase 1:** Logic cleanup, middleware for auth, extract chains/booleans. Low risk.
- **Phase 2:** Server Components for trip list + trip detail. Server Actions for mutations. Simplify TripOverview.
- **Phase 3:** Fix bugs (forgot password, Google linking).
- **Phase 4:** More pages to Server Components, shared loading/error patterns, code style doc.
- **Phase 5:** Maps integration (with coordinates-first routes).

Shadcn: Minimal. Only add if it clearly simplifies code (e.g. Toast). No UI overhaul.
