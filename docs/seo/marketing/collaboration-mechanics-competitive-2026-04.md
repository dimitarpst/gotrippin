# Collaboration mechanics — competitive landscape (study log)

**Date:** 2026-04-04  
**Topic:** How **group trip / shared itinerary** products implement **invites, permissions, real-time editing, voting, and “source of truth”** — distinct from [pricing](./trip-planner-pricing-conversion-study-2026-04.md), [SEO intent](./seo-search-intent-trip-planning-2026-04.md), and [hero positioning](./landing-hero-competitive-study-2026-04.md).

**Method:** Public marketing + help-center snippets (web search); one help URL fetch **timed out** — treat live help as **verify before citing in sales copy**.

---

## 1. Collaboration primitives (checklist)

| Primitive | What users expect | Why it matters |
|-----------|-------------------|----------------|
| **Invite** | Email, link, or in-app username | Friction vs viral spread; spam/abuse |
| **Permission levels** | View-only vs edit (sometimes owner/admin) | Prevents “someone nuked the trip” anxiety |
| **Sync model** | “Real-time like Google Docs” vs periodic save | Sets expectations for conflicts |
| **Voting / polling** | Democratic choice on options | Reduces chat arguments; extra UX surface |
| **Comments / chat** | In-trip thread vs “use WhatsApp” | Keeps context vs yet another inbox |
| **Tasks / ownership** | Who books what | Planors explicitly markets this |
| **Expense split** | Shared budget, settle-up | Common in group tools; optional for gotrippin |
| **Conflict handling** | Schedule overlaps, double bookings | Rarely marketed clearly; **Zeitrip** leads with “conflict detection” |

---

## 2. What competitors emphasize (public positioning)

| Product | Stated collaboration story | Notable mechanics (from public pages) |
|---------|----------------------------|----------------------------------------|
| **Wanderlog** | Plan together; live sync | Invite via **Share** / add person; **view vs edit** permissions; “**Google Docs–style**” real-time collaboration ([help center topic](https://help.wanderlog.com/hc/en-us/articles/4625495771163-Add-friends-to-plan-together), [store/listing copy](https://play.google.com/store/apps/details?id=com.wanderlog.android)) |
| **Planors** | No group-chat chaos | **Real-time** edits, **vote** on options, **delegate tasks**, budgets/files ([planors.com](https://www.planors.com/)) |
| **Triplanly** | Group itinerary in one place | **Shared map** → invite crew → build itinerary **together** ([triplanly.com](https://www.triplanly.com/)) |
| **Plan Harmony** | Group decisions without drama | **Voting** on activities/accommodation; blog content on **group psychology** (e.g. [make decisions together](https://planharmony.com/blog/make-decisions-together)) |
| **GatherTrip** | Text + AI as source of truth | Listens to **group messages**, updates itinerary ([gathertrip.com](https://www.gathertrip.com/)) |
| **Zeitrip** (niche) | Timezone + **conflict detection** | Flags impossible schedules while planning ([zeitrip.com](https://zeitrip.com/)) |

**Pattern:** Most brands claim **real-time** and **one place**; **few** explain **what happens when two people edit the same field** or **ordering conflicts** on a route. **Voting** differentiates “group politics” products from pure itinerary viewers.

---

## 3. gotrippin — alignment from internal audit (snapshot)

From `docs/BACKEND_FRONTEND_MOBILE_AUDIT.md`: trips support **`GET /trips/share/:shareCode`** and data model includes **`trip_members`** — i.e. **shared access** exists at the API/data layer. **Marketing** on `/home` should match **actual** permission and edit rules (no promising “live cursors” if the product is **async** or **last-write-wins**).

**Product strategy hooks:**

1. **Route order as shared truth** — Differentiator vs generic “list of activities”: the **ordered route** is the object crews align on (matches product direction).  
2. **Honest sync story** — If not true CRDT/multiplayer, say **“changes save for everyone”** or **refresh to see updates** rather than “Google Docs–style.”  
3. **Voting / tasks** — Optional later; strong SEO + sales angle for **group** segment but scope-heavy.  
4. **Schedule conflict detection** — Zeitrip-style wedge if you ever deepen **time + timezone** logic on the timeline.

---

## 4. Content & SEO angles (from this research)

| Angle | Example | Fit |
|-------|---------|-----|
| **Permission education** | Short section: “Who can edit the route?” | Tripsy-style **two cards** (view vs edit) when UX ships |
| **Vs group chat** | Same as Planors/Triplanly — already in your narrative | Keep **specific** (route + timeline), not generic |
| **Democratic planning** | Only if voting exists or is roadmap with clear date | Avoid vapor |
| **Technical honesty** | Blog: “How we sync trip edits” | Trust + GEO-friendly **unique** content |

---

## 5. Open questions (for product / UX)

- [ ] Document **actual** conflict behavior (last write, locking, optimistic UI?) and reflect in **help + marketing**.  
- [ ] Are **roles** only owner/member or finer (editor/viewer)? Expose in UI when stable.  
- [ ] Should **comments** live in-app or stay out of scope intentionally?

---

## 6. Changelog

| Date | Note |
|------|------|
| 2026-04-04 | Initial study: primitives matrix, competitor emphasis, gotrippin alignment, content angles |
