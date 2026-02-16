# Go Trippin' — Backend, Frontend & Mobile Reusability Audit

> Deep examination of what lives where, what's reusable, and what would need reconstruction for React Native.

---

## Executive Summary

| Layer | Current State | Mobile-Ready? |
|-------|---------------|---------------|
| **NestJS** | Trips, locations, activities, images, weather, profiles (endpoints exist) | ✅ Yes — all API logic is reusable |
| **Frontend API layer** | Calls NestJS with Supabase JWT | ✅ Yes — React Native would do the same |
| **Supabase (client)** | Auth, profiles, storage, RPCs — used directly in frontend | ⚠️ Partially — auth/storage work on RN; some flows differ |
| **Frontend-only logic** | Profile save, auth context, display helpers | ⚠️ Must be moved or replicated |

**Bottom line:** NestJS is in good shape for reuse. The main gap: **profiles and auth** are handled by Supabase in the browser, not by NestJS. For mobile, you’d either keep that pattern (Supabase client on mobile) or route profiles through NestJS.

---

## 1. What NestJS Does (Backend)

| Module | Endpoints | Data Source | Reusable for RN? |
|--------|-----------|-------------|------------------|
| **Auth** | `POST /auth/login` (Swagger/test), JWT validation | Supabase | ✅ JWT validation reused; login is client-side |
| **Profiles** | GET/PUT `/profiles`, `/profiles/:id` | Supabase `profiles` | ✅ Exists but **unused by web** |
| **Trips** | Full CRUD, `GET /trips/share/:shareCode` | Supabase `trips`, `trip_members` | ✅ Used |
| **TripLocations** | Full CRUD, reorder | Supabase `trip_locations` | ✅ Used |
| **Activities** | Full CRUD, `GET /grouped` | Supabase `activities`, `trip_locations` | ✅ Used |
| **Images** | `GET /images/search`, `POST /images/download` | Unsplash API | ✅ Used |
| **Weather** | `GET /trips/:id/weather` | Tomorrow.io API | ✅ Used |
| **AI** | Placeholder | — | Future |

**NestJS uses:** Supabase Service Role client (server-side only). No browser Supabase client.

---

## 2. What the Web Frontend Does

### 2a. Calls to NestJS (via `fetch` + Bearer token)

| API File | Endpoints Called | Token Source |
|----------|------------------|--------------|
| `api/trips.ts` | `/trips`, `/trips/:id`, `/trips/share/:shareCode` | `supabase.auth.getSession()` |
| `api/trip-locations.ts` | `/trips/:id/locations` | Same |
| `api/activities.ts` | `/trips/:id/activities`, `/trips/:id/activities/grouped` | Same |
| `api.ts` (images) | `/images/search`, `/images/download` | Same |
| `api/weather.ts` | `/trips/:id/weather` | Same |

**Token flow:** Frontend gets JWT from Supabase session → passes in `Authorization: Bearer <token>` → NestJS validates with `AuthService.validateToken()`.

**React Native:** Same pattern. Supabase client on mobile provides the JWT; RN app calls NestJS with that token.

---

### 2b. Direct Supabase Usage (bypasses NestJS)

| File | Usage | Purpose |
|------|-------|---------|
| **AuthContext** | `supabase.auth.*` | signIn, signUp, signOut, signInWithGoogle, getSession, onAuthStateChange, refreshSession |
| **AuthContext** | `supabase.from("profiles")` | Load profile for logged-in user, sync OAuth data |
| **user/page.tsx** | `supabase.from("profiles")` | Update profile (avatar_color, avatar_url) |
| **user/page.tsx** | `supabase.auth.updateUser` | Update display_name in metadata |
| **UserProfile** | `supabase.from("profiles")` | Refresh profile before edit |
| **LinkedAccountsCard** | `supabase.rpc("get_my_has_password")` | Check if user has password |
| **LinkedAccountsCard** | `supabase.rpc("ensure_email_identity")` | Create email identity after add-password |
| **LinkedAccountsCard** | `supabase.auth.linkIdentity`, `unlinkIdentity`, `updateUser` | Google link/unlink, add password |
| **AvatarUpload** | `supabase.storage` | List and upload avatars |
| **useLanguagePreference** | `supabase.from("profiles")` | Update `preferred_lng` |
| **ForgotPasswordDialog** | `supabase.auth.resetPasswordForEmail` | Password reset email |
| **reset-password page** | `supabase.auth.updateUser`, `onAuthStateChange` | Set new password |
| **ChangePasswordCard** | `supabase.auth.updateUser` | Change password |
| **ChangeEmailCard** | `supabase.auth.updateUser` | Change email |
| **auth/callback** | `supabase.auth.onAuthStateChange`, `getSession` | OAuth callback |

**Profiles:** The web app never uses NestJS for profiles. It uses Supabase directly.

---

## 3. Duplication & Gaps

### Profiles: Two Paths, One Used

- **NestJS:** `GET/PUT /profiles` — implemented, not used by web.
- **Web:** Direct `supabase.from("profiles")` — used everywhere.

For mobile: Either keep using Supabase for profiles (like web) or route profiles through NestJS for consistency.

---

### Auth: Split Responsibility

- **Supabase client (browser):** Login, logout, OAuth, session, token refresh.
- **NestJS:** JWT validation for protected routes; `POST /auth/login` is for Swagger/testing only.

Supabase Auth is designed for clients (web + mobile). React Native would use `@supabase/supabase-js` (or RN-specific Supabase client) for auth. OAuth on mobile uses deep links instead of redirects; Supabase supports both.

---

### Token Retrieval: Duplicated

`getAuthToken()` is implemented separately in:
- `api/trips.ts`
- `api/weather.ts`
- `api/activities.ts`
- `api/trip-locations.ts`

Each one imports Supabase and reads the session. Should be centralized in one helper.

---

### Display Helpers in Frontend

In `api/trips.ts`:
- `formatTripDate()`
- `calculateDaysUntil()`
- `calculateDuration()`

Pure functions, no API. Could live in `@gotrippin/core` for reuse by web and RN.

---

### Validation: Shared but Used in Two Places

- `@gotrippin/core` has Zod schemas.
- **Frontend** `lib/validation.ts` uses them for client-side validation before sending.
- **NestJS** uses DTOs built on the same schemas.

No duplication of schemas; validation is correctly shared.

---

## 4. React Native Reusability

### Reusable As-Is

| Item | Why |
|------|-----|
| **NestJS backend** | All trips, locations, activities, images, weather. Add profiles if you route them through API. |
| **@gotrippin/core** | Types, schemas, share-code utils. Move date/duration helpers here. |
| **API call pattern** | Get JWT from Supabase → `fetch(NEST_URL, { headers: { Authorization: Bearer token } })` |
| **Supabase Auth** | Works on RN with deep links for OAuth |
| **Supabase Storage** | Avatar upload/download works on RN |

---

### Needs Adaptation

| Item | Web | RN |
|------|-----|-----|
| **Auth flow** | Redirects (OAuth) | Deep links |
| **Session storage** | `localStorage` / cookies | Secure storage (Supabase handles this) |
| **Profiles** | Direct Supabase | Same, or migrate to NestJS |
| **API base URL** | `NEXT_PUBLIC_API_URL` | Config/env for NestJS URL |

---

### Must Be Rebuilt (UI Only)

| Item | Reason |
|------|--------|
| Pages, layout, components | Next.js → React Navigation (or similar) |
| Forms, inputs, buttons | DOM → RN primitives or UI library |
| **Maps** | Web: Mapbox GL JS / `react-map-gl`. RN: `react-native-maps` or `expo-maps` — different APIs |
| i18n | `react-i18next` works on RN with different setup |

---

## 5. Maps: Web vs Mobile

| Platform | Library | Notes |
|----------|---------|-------|
| **Web** | Mapbox GL JS, `react-map-gl` | Per MAPS_IMPLEMENTATION.md |
| **Mobile** | `react-native-maps` (or `expo-maps` if using Expo) | Native map views |
| **Expo** | Optional. Expo supports `react-native-maps`. You can use RN without Expo. |
| **Shared** | Coordinates (lat/lng), trip_locations schema | Same data, different renderers |

Maps UI and integration must be written per platform; backend and data models stay the same.

---

## 6. Recommendations for Mobile Readiness

### High Priority

1. **Centralize `getAuthToken()`** — One helper used by all API modules.
2. **Move date helpers to `@gotrippin/core`** — `formatTripDate`, `calculateDaysUntil`, `calculateDuration`.
3. **Decide on profiles** — Either:
   - A) Keep Supabase direct (web + RN use Supabase client), or
   - B) Migrate web to NestJS `/profiles` and have RN use that too.

### Medium Priority

4. **Document API contract** — OpenAPI/Swagger from NestJS; RN can use generated clients.
5. **Shared API client** — A thin layer (e.g. `apiClient.get('/trips', { token })`) that web and RN can both use.

### When You Build Maps

6. **Coordinates in `trip_locations`** — Already present. Weather and AI can use them.
7. **POI search** — Google Places or similar; can live in NestJS as an endpoint for both web and RN.

---

## 7. What to Remove (from earlier discussion)

| Item | Action |
|------|--------|
| `/testqueries` page + `TestQueriesClient` | Remove |
| `ProfileFormExample`, `TripFormExample` | Remove (use `/api/profiles` which doesn't exist) |
| `calendar-05.tsx` vs `calendar.tsx` | Audit which is used; remove duplicate |
| NestJS on port 3001 | **Keep** — this is your backend |

---

## 8. Profile Page Bug (from discussion)

**Observed:** After login, profile page is broken (logout, edit, etc.) until hard refresh.

**Cause:** Likely a race between:
1. AuthContext loading session and profile
2. User page / LinkedAccountsCard running effects (e.g. `get_my_has_password`, `ensure_email_identity`)
3. Components mounting before session and profile are ready

**Effect chain:** User page → UserProfile → LinkedAccountsCard. LinkedAccountsCard has `useEffect` that calls `supabase.rpc("get_my_has_password")` when `user?.id` exists. If the session or profile is not fully ready, some handlers or state may not attach correctly.

**Next step:** Trace mount order, session readiness, and when each effect runs on the user page and its children.
