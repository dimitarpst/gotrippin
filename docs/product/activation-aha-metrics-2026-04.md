# Activation & “aha” metrics — gotrippin (study)

**Date:** 2026-04-05  
**Purpose:** Define **funnel stages**, **north-star / aha definitions**, and **instrumentation** aligned with the strategy in [`docs/seo/marketing/market-strategy-idea-origin-deep-dive-2026-04.md`](../seo/marketing/market-strategy-idea-origin-deep-dive-2026-04.md) (J2 = shape the trip; **route spine** as differentiator).

**Ground truth from code (web):**

- After **OAuth / magic link**, [`app/auth/callback/route.ts`](../../apps/web/app/auth/callback/route.ts) redirects to **`/trips`** (not `/home`).
- **Email+password sign-in** in [`AuthForm.tsx`](../../apps/web/src/components/auth/AuthForm.tsx) sends users to **`/trips`**.
- **Trip creation** is a **two-step** flow: [`CreateTripPageClient`](../../apps/web/app/trips/create/CreateTripPageClient.tsx) (details → “Open route editor”) → [`/trips/create/route`](../../apps/web/app/trips/create/route/CreateRouteDraftPageClient.tsx) with draft in **`sessionStorage`** (`createTripDraft`). The **trip is persisted only when the user confirms the first stop** (`createTripAction` + `apiAddLocation`), then redirect to **`/trips/{shareCode}/route?wizard=1`**.
- **Share / guests** exist in the trip UI ([`trip-overview.tsx`](../../apps/web/src/components/trips/trip-overview.tsx) — share trip, manage guests); collaboration “aha” must be measurable **server-side** (e.g. `trip_members` count), not only UI clicks.

There is **no** product analytics SDK (PostHog, Segment, etc.) in the web app today — **definitions below are spec-first**; implementation is a separate task.

---

## 1. Definitions

| Term | Meaning |
|------|---------|
| **Account** | `auth.users` row; session present in app. |
| **Trip (persisted)** | Trip row exists via API (after first-stop confirmation on create-route flow, or other create paths if any). |
| **Route spine** | At least one **`trip_location`** with valid `order_index` (ordered path). |
| **Activation (solo)** | User reaches a **defined** milestone that proves J2 for themselves (recommended: **first location** or **first activity** — pick one primary). |
| **Aha (crew)** | Evidence that the trip is **shared truth** for more than one person — recommended: **`trip_members` ≥ 2** for that trip (verify exact schema/RPC in backend). |
| **Time-to-value (TTV)** | Wall-clock or session time from **account_created** or **first_session** to milestone. |

---

## 2. Funnel stages (ordered)

Use these as **event names** or **warehouse stages**; IDs are stable for dashboards.

| Stage ID | User-visible step | Technical / product signal | Drop-off question |
|----------|-------------------|---------------------------|-------------------|
| **S0** | Land on marketing or auth | Page view `/home`, `/auth` | SEO / trust / CTA |
| **S1** | Signed in | Supabase session; hit `/trips` | Auth friction, email confirm |
| **S2** | Opened create flow | View `/trips/create` | Intent vs fear of commitment |
| **S3** | Completed trip **details** (step 1) | `onSave` → step 2 state | Form abandonment |
| **S4** | Opened route editor | Navigate to `/trips/create/route` with draft in storage | Confusion about step 2 |
| **S5** | **Trip persisted** | `POST /trips` success (`createTripAction`) | API/validation errors |
| **S6** | **First stop on route** | First `trip_location` created for trip | Map/search UX |
| **S7** | Landed on trip route (post-create) | View `/trips/{shareCode}/route` | Redirect errors |
| **S8** | Opened **timeline** or **map** (non-route) | View `/timeline` or `/map` | IA discovery |
| **S9** | **First activity** | First activity created for trip | Value vs “stops only” |
| **S10** | **Share** | Share sheet opened / link copied / invite sent | Do users know sharing exists? |
| **S11** | **Second member** | `trip_members` count ≥ 2 | Invite flow, partner adoption |

**Primary activation (choose one for dashboards):**

- **Recommended default:** **S6 — first trip_location** — matches **route-first** positioning; trip exists only after first stop anyway in the main flow.
- **Alternative stricter aha:** **S9** — first activity (proves itinerary depth).
- **Crew north star:** **S11** — second member (validates **group** value).

---

## 3. Metrics spec (what to graph)

| Metric | Definition | Type |
|--------|------------|------|
| **Activation rate** | Users who hit **S6** within **7d** of **S1** / users who hit **S1** | Ratio |
| **Create funnel conversion** | S6 / S2 (or S6 / S1 for logged-in only) | Ratio |
| **Median TTV to S6** | `time(S6) - time(S1)` among activated | Duration |
| **Wizard completion** | Users hitting S7 with `?wizard=1` who then dismiss complete vs bounce | Funnel |
| **Collaboration rate** | Trips with S11 within **30d** of S6 / trips with S6 | Ratio |
| **Ghost trips** | S5/S6 but no S8/S9 in **14d** | Health (stuck users) |

Slice by: **signup method** (Google vs email), **locale**, **device** (mobile vs desktop), **referrer**.

---

## 4. Instrumentation options (no code in this doc)

| Layer | Pros | Cons |
|-------|------|------|
| **Client events** (PostHog, Plausible custom, GA4) | Fast UI funnel, session replay | Ad blockers; must not send PII |
| **Server / API** (Nest logs, DB triggers, audit table) | **Source of truth** for S5, S6, S11 | More engineering |
| **Warehouse** (Supabase → ETL) | Flexible retroactive | Slower to ship |

**Minimum credible setup:** **Server-side** counts for **trips created**, **locations per trip**, **members per trip** + **one** client library for **S2–S4** drop-offs (where server sees nothing).

**Privacy:** Avoid trip titles, emails, or PII in event properties; use **hashed user id** or internal UUID only.

---

## 5. Experiments to run after baseline exists

1. **Step 2 clarity** — Copy test on “Open route editor” / route step (see `CreateTripPageClient` strings); measure S3→S4→S6.
2. **Post-auth landing** — Today OAuth → `/trips`. Test **deep link** to `/trips/create` for campaign traffic with `?intent=new_trip`.
3. **Wizard=1** — Measure completion of first extra stop or first timeline visit from route wizard.
4. **Share prompt timing** — Prompt share after S6 vs after S9; measure S11.

---

## 6. Alignment with strategy doc

- **J2 “shape the trip”** → **S6** is the **earliest honest activation**.
- **Group truth** → **S11** is the **crew aha**; marketing that promises “together” should move this metric, not only signups.
- Do **not** optimize solely for **S1** (empty accounts on `/trips`).

---

## 7. Changelog

| Date | Note |
|------|------|
| 2026-04-05 | Initial study: funnel S0–S11, activation definitions, metrics, instrumentation guidance, grounded in web create flow |
