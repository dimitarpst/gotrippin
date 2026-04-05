# Marketing frontend — saturation crawl (Round 10)

**Date:** 2026-04-03  
**Intent:** **US road-trip / AI stops** (Roadtrippers), **post-trip + physical goods** (Polarsteps Travel Book), **inbox-forward itinerary** (TripIt), **flight meta** (Skyscanner), and **megasite access** deltas (TripAdvisor **403**, Roamaround still **503**, Rail Europe timeout).

**Prior:** [Round 9](./marketing-frontend-saturation-round9-2026-04.md) · [Round 3 rubric](./marketing-frontend-rubric-round3-2026-04.md) · [Part I](./marketing-frontend-home-deep-dive-2026-04.md)

**Next:** [Round 11](./marketing-frontend-saturation-round11-2026-04.md) (cruise, G Adventures / Intrepid, GetYourGuide; Viator timeout)

---

## 1. Mega crawl log (this session)

| URL | Result | Bucket |
|-----|--------|--------|
| [roadtrippers.com](https://roadtrippers.com/) | **OK** — AI “autopilot” stops + collaborate + magazine + byway SEO | **Road** + content |
| [polarsteps.com](https://www.polarsteps.com/) | **OK** — itinerary + tracker + **Travel Book** commerce + privacy | **Journal** + **D2C print** |
| [tripit.com/web](https://www.tripit.com/web) | **OK** — forward-email USP, Pro, 20th anniversary, blog | **Inbox** itinerary |
| [skyscanner.com](https://www.skyscanner.com/) | **Thin** fetch (title only in pass) | Flight **meta** |
| [tripadvisor.com](https://www.tripadvisor.com/) | **403** (vs timeout in Rounds 7–8) | OTA / UGC — **blocked** |
| [raileurope.com](https://www.raileurope.com/) | **Timeout** | Rail reseller |
| [eurail.com](https://www.eurail.com/) | **Thin** (title line; same as Round 9) | Pass seller |
| [roamaround.com](https://www.roamaround.com/) | **503** | AI trip — **still down** |

---

## 2. Deep dives

### 2.1 Roadtrippers — AI detours + editorial SEO

- **Hero:** “Take unforgettable road trips” + **AI-powered recommendations** for detours; **Quick Launch** vs **Plan with autopilot** (modes).
- **Social proof:** “41M+” style counter in extract (“41 42 43” — likely animated; verify in browser).
- **Collaborate:** Explicit **Plan, discover, and collaborate** — overlaps gotrippin **group** story but **modal = car + US POIs**.
- **Content:** **Magazine** articles, **Famous Routes** / **Interstate** trip deep links (`maps.roadtrippers.com/trips/...`), **National Parks** destination grid — **Komoot-class** tail on **roads**.
- **Takeaway:** Strong model for **route + stops** SEO; we should **not** clone US-road gimmicks unless product is road-native. **AI stops** copy is mainstream now — differentiate with **shared timeline + truth** on what shipped.

### 2.2 Polarsteps — tracking, recap, **Travel Book**

- **Jobs:** Itinerary builder, **trip tracker** (auto route), step updates, stats — **during** trip.
- **Monetization:** **Travel Book** hardback + **gift card** — **physical** recap (unusual vs pure SaaS).
- **Privacy:** Full **audience** control (only you / friends / world) — trust block above fold.
- **Proof:** **20M+** explorers, **ad-free**, **offline**, battery claim — clear **C** + **F** ethics.
- **Takeaway:** Closer to **Pebbls** (Round 6) **post-trip** lane; gotrippin is **plan + execute** first — **printed recap** is a **later** brand moment, not homepage parity.

### 2.3 TripIt — email as API

- **Hook:** “Organize Your Travel Itinerary **Automatically**” — forward confirmations → unified itinerary.
- **Pro:** Flight alerts, reminders, **Travel Guidance** blog tie-in.
- **Milestone:** **20 years** banner — longevity as **C**.
- **Takeaway:** **Inbox parsing** is a **feature** we may touch (email forward) but marketing should not promise **TripIt parity** until product does. Good reference for **clear 3-step** story (book → forward → one timeline).

### 2.4 Skyscanner — thin pass

- **Fetch:** Mostly title; likely **heavy JS** shell. Judge only in browser.
- **Takeaway:** Same bucket as **Booking** — flight **intent** capture, not collaborative planning.

### 2.5 TripAdvisor — 403 this round

- **Change:** **403 Forbidden** on automated fetch (previously **timeout** in text fetch).
- **Implication:** Bot mitigation tightened or regional; **browser-only** per Round 8 still mandatory.
- **Takeaway:** Do not burn cycles on server-side **TA** snapshots; keep on **manual** audit list.

### 2.6 Roamaround — still 503

- No change vs Rounds 7–9; keep **watchlist** item in `seo.todo` notes if desired.

---

## 3. Adjacency — plan vs track vs print

| Job | Roadtrippers | Polarsteps | TripIt | gotrippin |
|-----|--------------|------------|--------|-----------|
| **Pre-trip plan** | Strong (route) | Medium | Medium (forward) | **Core** |
| **During trip** | Navigate / stops | **Track + share** | Alerts | Roadmap |
| **After trip** | Content / mag | **Book + reel** | History | Gallery / notes / print |
| **Group** | Collaborate | Share link | Weak | **Spine** |

---

## 4. Rubric supplement (Round 10)

Same **A–F** scale as [Round 3](./marketing-frontend-rubric-round3-2026-04.md).

| Surface | A | B | C | D | E | F | **Avg** | Notes |
|---------|---|---|---|---|---|---|---|-------|
| **Roadtrippers /** | 5 | 5 | 4 | 5 | 4 | 4 | **4.5** | Magazine + routes = **D**; AI = **C** |
| **Polarsteps /** | 5 | 5 | 4 | 4 | 5 | 5 | **4.7** | **Travel Book** = **E**; privacy + ethics **F** |
| **TripIt /web** | 5 | 4 | 4 | 4 | 4 | 4 | **4.2** | Solid **A** story; blog = **D** |
| **Skyscanner /** | — | — | — | — | — | — | **n/a** | Retry browser |
| **Eurail /** | — | — | — | — | — | — | **n/a** | Retry browser |

---

## 5. Idea buffet — ×14

1. **Polarsteps-style** privacy copy if we add **public trip links**.  
2. **Roadtrippers** “two modes” (explore vs autopilot) — analogous to **browse vs plan** in product, not necessarily marketing.  
3. **TripIt** “forward email” — one **honest** FAQ line when feature exists.  
4. **Milestone** banner (e.g. anniversary) only when real.  
5. **Magazine** — only with editorial capacity (Roadtrippers scale).  
6. **Interstate SEO** — irrelevant unless US road is core.  
7. **Travel Book** — long-term merch; separate from `/home` SEO.  
8. **403/503 log** in this series — use for **expectations** (automated crawl ≠ user Chrome).  
9. **Skyscanner** — meta search is **not** our narrative; skip competitor hero mimicry.  
10. **Collaborate** word — test vs **plan together** for gotrippin ICP.  
11. **National parks** grid — destination SEO only if we have **place** depth.  
12. **Battery / offline** claims — only with engineering proof (Polarsteps pattern).  
13. **Roamaround** — single retry when **200** (append Round 10b or Round 11).  
14. **TripAdvisor** — capture **one** screenshot set in local Chrome for archive.

---

## 6. Changelog

| Date | Note |
|------|------|
| 2026-04-03 | Round 10: Roadtrippers, Polarsteps, TripIt, Skyscanner thin, TripAdvisor 403, Rail Europe timeout, Roamaround 503, adjacency + rubric |
