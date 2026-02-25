# Todo archive (completed items)

Completed tasks are kept here for history. The main task list is the root `features.todo` file.

---

Todo:
  ✔ Centralize getAuthToken() — single helper for api/trips.ts, api/weather.ts, api/activities.ts, api/trip-locations.ts
  ✔ Move date helpers to @gotrippin/core — formatTripDate, calculateDaysUntil, calculateDuration
  ✔ Remove localStorage — no localStorage; use session/cookies (i18n, AuthContext, Supabase uses cookies)
  ✔ Extract chains/booleans — trips-list.tsx, location-card.tsx, AvatarUpload.tsx
  ✔ Avatar picker shows all uploaded avatars — fix isMounted guard blocking setUserAvatarFiles on storage list success
  ✔ Cross-platform audit — ensure same data/behavior for web + mobile (review BACKEND_FRONTEND_MOBILE_AUDIT.md, fix inconsistencies)

Phase 1.1 — Cross-platform audit (step-by-step):
  ✔ Update stale audit doc — getAuthToken centralization, date helpers, profiles decision (Supabase direct)
  ✔ Review per section — walk through NestJS, frontend API, Supabase usage, gaps
  ✔ Identify inconsistencies — list mismatches between web + mobile expectations
  ✔ Decide and document — keep web as-is; items 1–4 addressed when building RN
  ✔ Implement fixes — none needed for web
  ✔ Mark audit complete

Phase 2 — Architecture:
  ✔ Server Components for trip list — fetch trips on server, pass to client
  ✔ Server Components for trip detail — fetch trip + locations + timeline + weather on server
  ✔ Server Actions for mutations — trip create/update/delete
  ✔ Simplify TripOverview — grouped props: actions, timeline, weather (was ~25 flat props)

Phase 4+:
  ✔ Image pipeline — avatars on Cloudflare R2; key-based storage (not full URLs); resolveAvatarUrl helper

Phase 4.1 — Trip cover images (photos table + R2):
  ✔ DB: photos table — storage_key, source (unsplash|upload), unsplash_photo_id, photographer_name, photographer_url, blur_hash (required for unsplash)
  ✔ DB: trips.cover_photo_id FK to photos; migrate existing image_url
  ✔ Backend: download Unsplash image → R2, track download, create photo row
  ✔ Frontend: picker saves via new flow; resolve cover URL from photo
  Shared loading/error patterns:
    ✔ Install shadcn skeleton — base primitive for all skeleton UIs
    ✔ Install shadcn spinner — replace all 3 custom spinner variants across the app
    ✔ Install shadcn alert — base primitive for all error messages
    ✔ Install shadcn sonner — toast notifications for mutations (save, delete, update)
    ✔ Write PageLoader component — thin wrapper: AuroraBackground + Spinner + optional message; replaces copy-pasted loading <main> blocks in create/edit trip
    ✔ Write PageError component — thin wrapper: AuroraBackground + Alert destructive + optional retry; for route-level failures
    ✔ Add app/error.tsx — Next.js route error boundary using Alert as UI (per AGENTS.md)
    ✔ Replace custom spinners — create/edit trip, user page, reset-password, avatar upload
    ✔ Replace skeleton divs — TripSkeleton, TripOverviewSkeleton, avatar picker skeletons use shadcn Skeleton as primitive
    ✔ Replace ad-hoc error divs — home page banner, timeline, weather, trips list use Alert destructive
    ✔ Wire sonner toasts — trip save/delete/update mutations show toast on success and error
  Priority (higher impact than Phase 5):
    ✔ Code style doc — readable-code rules for future PRs (docs/CODE_STYLE.md)

Phase 4.3 — No Fallbacks. No Silent Failures. Handle Errors:
  Visible color/state flicker:
    ✔ Remove canvas dominant color extraction — trip-overview.tsx and weather/page.tsx both load the cover image into a canvas to guess a color; this fires after render causing a visible color flicker, and fails with CORB errors on Unsplash URLs. Delete this logic entirely. The trip's stored color is the source of truth — use it directly.
    ✔ Remove #ff6b6b hardcoded color chains — trip-overview.tsx, weather/page.tsx, timeline/[locationId]/page.tsx, UserProfile.tsx all fall back to "#ff6b6b" silently. If no color is set, show a neutral/empty state, not a hardcoded brand color.
  Silent server-side swallowing (trips/[id]/page.tsx):
    ✔ getLocations .catch(() => []) — if locations fail to load, the trip detail page shows an empty route silently. Propagate the error to the client so TripDetailPageClient can show a SectionError instead.
    ✔ getGroupedActivities .catch(() => empty object) — same: timeline silently appears empty on error. Surface it.
    ✔ getTripWeather .catch(() => null) — weather silently disappears on error. Pass the error to the client to show an error state.
  Silent hook-level swallowing:
    ✔ useTripLocations fetchLocations().catch(() => {}) — if hook internal error handling fails, outer catch buries it. Convert to a single try/catch that always calls setError.
    ✔ useWeather fetchWeather().catch(() => {}) — same pattern.
    ✔ useTripTimeline fetchData().catch(() => {}) — same pattern.
  Silent refetch button errors (no feedback when retry fails):
    ✔ lodging-form.tsx refetch buttons — .catch(() => {}) on onClick; wire toast.error so user knows retry failed.
    ✔ train-route-form.tsx refetch buttons — same.
    ✔ trip-overview.tsx onRefetchWeather — same.
    ✔ timeline/[locationId]/page.tsx refetchWeather buttons — same.
  "TBD" fake data:
    ✔ trip-overview.tsx and trips-list.tsx — startDate/endDate fall back to "TBD" string when dates are missing. Replace with explicit empty/placeholder UI (e.g. a dash or "No dates set") that is visually distinct, not fake data.
  Auth/profile silent swallowing (LinkedAccountsCard):
    ✔ supabase.auth.refreshSession().catch(() => {}) — if session refresh fails, nothing happens. At minimum log the error; ideally surface a toast so user knows their session may be stale.
    ✔ refreshProfile .catch(() => {}) calls (×4) — same: if profile refresh fails silently the UI shows stale data. Log or toast.
  Broken avatar images:
    ✔ AvatarUpload.tsx img onerror — replaces broken avatar src with a base64 SVG placeholder silently. Remove the replacement; show a visible broken/missing state (e.g. grey square or initials) so it's clear the image failed, not that it loaded.

Phase 4.2 — One NestJS endpoint per screen (web server component + mobile reuse):
  Goal: Add a single NestJS endpoint per screen that returns the full payload. Web server component calls it for instant render; mobile calls the same endpoint.
  Checked items — mobile: User (Supabase only, same on RN). Auth (N/A, no payload). Create/Edit (1 call GET /trips/share/:code, same on RN). Unsplash+blurhash (same GET /images/search; need blur_hash in response). Timeline & Weather (2 calls each, same on RN; no combined endpoint).
  ✔ User Profile (/user) — check auth server-side, instant redirect, pass user prop to client
  ✔ Auth Page (/auth) — instantly redirect logged-in users to /trips via createServerSupabaseClient
  ✔ Create/Edit Trip — secure on server; for edit, fetch trip data server-side to skip initial loading
  ✔ Unsplash search drawer thumbnails — use blurhash as placeholder (CoverImageWithBlur) until image loads
  ✔ Timeline & Weather sub-pages — server components; NestJS already has per-resource endpoints (activities, weather)
  ✔ Trip Detail — NestJS: GET /trips/share/:shareCode/detail (trip + locations + timeline + weather). Web: page calls it server-side; mobile reuses.
  ✔ Trip List — NestJS: GET /trips is the contract. Web: server component calls it; mobile reuses.
  ✔ Home Page — GET /trips (same as list). Web: server component fetches server-side; mobile reuses.
  ✔ User Page — Supabase direct per audit (profiles). Web: server component; mobile mirrors.
  ✔ Auth callback (/auth/callback) — route handler does code exchange + redirect; no page (Next.js conflict)
  ✔ Reset password (/auth/reset-password) — server component wrapper; client form (session from hash + updateUser)
  ✔ Activity type (/trips/[id]/activity) — server component; fetch trip server-side, pass to client
  ✔ Activity lodging (/trips/[id]/activity/lodging) — server component; fetch trip server-side, pass to client
  ✔ Activity flight (/trips/[id]/activity/flight) — server component; fetch trip server-side, pass to client
  ✔ Activity flight by id (/trips/[id]/activity/flight/[flightId]) — server component; fetch trip server-side, pass to client
  ✔ Activity route (/trips/[id]/activity/route) — server component; fetch trip server-side, pass to client

Phase 5 — Public Trip Sharing (done for now):
  ✔ Add color picker — replace native input[type=color] in profile
  ✔ Add newest drawer element from shadcn/ui
