# Marketing frontend research — `/home` & public marketing surface (deep dive)

**Date:** 2026-04-05  
**Scope:** Everything a visitor **sees and clicks** before deep product use: **landing page composition**, **navigation**, **section patterns**, **CTA hierarchy**, **footer**, **related routes** (`/privacy`, `/terms`), and how this compares to **trip / group planner competitors**.  

**Not in scope here:** App-shell UI (`/trips/*`), backend APIs, paid ads creatives.

**Strategic anchor:** [`market-strategy-idea-origin-deep-dive-2026-04.md`](./market-strategy-idea-origin-deep-dive-2026-04.md) (J2, route spine). **Hero-format critique:** [`landing-hero-competitive-study-2026-04.md`](./landing-hero-competitive-study-2026-04.md).

---

## 1. What “marketing frontend” means for gotrippin (inventory)

| Surface | Route / file | Role |
|---------|--------------|------|
| **Primary landing** | [`/home`](../../apps/web/app/home/page.tsx) | Main conversion story; canonical in metadata |
| **Root** | `/` | Should redirect to `/home` (SEO baseline per `docs/seo/seo.todo`) |
| **Auth entry** | `/auth` | Often second step after CTA — part of **funnel UX**, not “landing layout” but copy continuity matters |
| **Legal** | `/privacy`, `/terms` | Trust, ads, store listings; currently stubs — footer links |
| **Sitemap / robots** | `sitemap.ts`, `robots.ts` | Discovery, not visual — affects **what** pages exist publicly |

**Primary assembly today:** `HomeRoutePage` → `LandingNav` + `HomeHeroSection` + `HomeBelowFold` (`LandingMarketingSections` → `BentoFeatures` → `LandingFinalCta` → `CtaFooter`).

---

## 2. Competitor marketing frontend — pattern taxonomy

Below: **recurring blocks** on **consumer trip / group planner** sites (from public page structure and fetches such as [wanderlog.com](https://wanderlog.com/), [planharmony.com](https://www.planharmony.com/), [tripsy.app](https://tripsy.app/), [planors.com](https://www.planors.com/), [triplanly.com](https://www.triplanly.com/), [huddle.travel](https://huddle.travel/)).

| Pattern | Typical purpose | Who uses it heavily | gotrippin today |
|---------|-----------------|---------------------|-----------------|
| **H1 + subhead + dual CTA** | Value prop + primary path + soft explore | Almost all | Yes (`HeroTopServer`) |
| **Product visual in hero** | Proof of “real app” | Tripsy, Wanderlog-class | Yes (`HeroMockup` — PNG/SVG; contested quality) |
| **Social proof above fold** | Stars, “1M users”, press | Wanderlog (massive testimonial wall), Plan Harmony (ratings + trip counts) | **No** (honest gap) |
| **Nav: product + pricing + blog** | Discovery, SEO, trust | Planors (pricing on marketing site), Plan Harmony (blog, pro) | Nav: Features, Support (GitHub issues) — **no pricing, no blog** |
| **Anchored story sections** | Scroll narrative (#problem → #map → #ai) | Tripsy-style long-form | Yes (`#story`, `#map`, `#ai`, `#together`, `#features`) |
| **Feature grid / bento** | Scan features without reading | gotrippin Bento; others use icon rows | Yes (`BentoFeatures`) |
| **FAQ on homepage** | Objections, SEO, AI extractability | Plan Harmony (long FAQ) | **No** |
| **Comparison callout** | “vs TripIt / Wanderlog” | Plan Harmony (FAQ + positioning) | **No** (strategy doc has logic; page doesn’t) |
| **Pricing table** | Conversion for SaaS | Planors, many tools | **No** (OK pre-monetization) |
| **Dark final CTA band** | Hard stop + contrast | Tripsy pattern; gotrippin | Yes (`LandingFinalCta`) |
| **Footer: columns + legal + social** | Trust + crawl paths | Standard | Yes (`CtaFooter` + theme + language) |
| **Mobile: app install push** | QR, Get the app | Wanderlog, Tripsy | **No** (web-first — intentional) |

---

## 3. Pattern deep dives (what winners optimize)

### 3.1 Hero

- **Wanderlog:** Headline is **category-scale** (“One app for all your travel planning needs”); immediate **Start planning** (web) + **Get the app** (parallel). Subhead reinforces **map + itinerary unity** — same strategic line as their product.
- **Plan Harmony:** Headline is **superlative + emotional** (“smartest way”); strong **social proof** (trusted by X, trips/month, reviews); dual CTA **Start free** + **For professionals** (ICP split).
- **Tripsy:** Calm **Apple-adjacent** banding; long **scroll** of **one idea per section**; hero supports **device truth** (see `tripsy-marketing-reference.md`).

**Implication for gotrippin:** Your hero is **emotionally differentiated** (“chaos” line — see `hero-tagline-research.md`) but **visually** competes in the same **“big mockup”** arena as better-funded polish unless you **commit** to premium captures or **pivot** to copy-led / abstract hero (already discussed in hero competitive study).

### 3.2 Social proof

- Category norm for **mature** brands: **star rating**, **review count**, **user scale**, **quotes**, sometimes **press logos**.
- **Early honest products** often skip or use **one real quote** — better than fake badges (your strategy doc warns this).

**Implication:** Frontend gap is **real** but **should stay honest**. Options: GitHub stars/activity, “built in public,” founder quote, first beta crew quotes — **only** when true.

### 3.3 Mid-page “visual placeholders”

- gotrippin’s **`#map` band** uses a **dashed placeholder** + copy that says screenshots are temporary (`LandingMarketingSections`) — **transparent** but **weak visually** vs competitors showing **real UI or illustration**.

**Implication:** Either (a) **lean in** with intentional **illustration / motion** (no fake photos), or (b) **replace** with **one** strong loop or diagram of **route → timeline** isomorphism — aligns with strategy (“route spine”).

### 3.4 FAQ & comparison

- **Plan Harmony** uses homepage **FAQ** for SEO + objection handling (“How are you different from TripIt or Wanderlog?”).

**Implication:** High-value **frontend** addition when copy is stable: **visible** FAQ (not hidden) so JSON-LD later is legitimate (`seo.todo` Phase 2).

### 3.5 Footer & controls

- gotrippin is **ahead of many** on **footer utility**: **Theme** + **language** (EN/BG) — good **international** signal; competitors often bury language.

**Tradeoff:** Cookie-based locale for hero is **LCP-friendly** but **SEO/hreflang** is deferred (`seo.todo` Phase 5) — document as known crawler tradeoff, not a visual bug.

---

## 4. gotrippin `/home` — component map (frontend engineer view)

| Order | Component | Client/Server | Anchor IDs | Notes |
|-------|-----------|---------------|------------|-------|
| 1 | `LandingNav` | client | — | Mobile menu; CTAs to `/trips` or `/auth` |
| 2 | `HomeHeroSection` | server wrapper | — | `min-h-[100svh]`; heavy vertical space |
| 2a | `HeroTopServer` | server | — | H1, lead, primary + `#story` ghost CTA; **LCP text** |
| 2b | `HeroMockupDeferred` | client (dynamic, SSR) | — | Product visual; deferred chunk for perf |
| 3 | `LandingMarketingSections` | client | `#story` `#map` `#ai` `#together` | Framer `whileInView` animations |
| 4 | `BentoFeatures` | client | `#features` | Grid cards; abstract SVG route |
| 5 | `LandingFinalCta` | client | — | Dark band; uses `useAuth` |
| 6 | `CtaFooter` | client | — | Columns, legal, GitHub, theme, language |

**i18n:** Hero lines from **server** (`getLandingHero` + cookie); below-fold from **`useTranslation`** (`landing.*` keys) — two pipelines; keep **terminology aligned** when editing copy.

**Auth-aware CTAs:** Hero is **server** (`signedIn` from `getUser()`); final CTA is **client** (`useAuth`) — rare edge: **stale button label** if session changes without refresh; low priority but real.

---

## 5. Gap analysis (marketing frontend only)

| Area | vs category leaders | Severity |
|------|---------------------|----------|
| **Social proof** | Missing ratings/quotes/scale | Medium (acceptable if honest) |
| **Hero visual** | Competes with Tripsy/Wanderlog polish | **High** (strategic — fix narrative or assets) |
| **Mid-page visuals** | `#map` placeholder reads “unfinished” | Medium |
| **FAQ / comparison** | Missing easy objection handling | Medium (SEO + CRO) |
| **Pricing** | N/A for pre-revenue | Low |
| **Blog / guides** | No content hub | Medium-long term (SEO) |
| **Nav depth** | No Pricing / Blog / About | Low until those exist |
| **Sticky CTA / nav** | Nav fixed; no floating “Start” | Low optional test |

---

## 6. Recommendations (prioritized — frontend & content)

### P0 — Align **story** with **strategy** (mostly copy + one visual decision)

1. **Decide hero direction:** **Premium real UI** *or* **copy-first / abstract route** — avoid middle mush (per strategy + hero study).
2. **Tighten `#map` section:** Replace dashed “temporary” box with **designed** schematic (motion or illustration) *or* **one** honest screenshot — don’t leave “under construction” energy in the **middle** of the page.

### P1 — Trust & conversion surfaces

3. **Add FAQ block** (4–6 Qs): group chaos, vs chat/sheets, what’s free, how sharing works — mirror [`market-strategy` Part F5](market-strategy-idea-origin-deep-dive-2026-04.md) “why not Sheets.”
4. **Optional comparison strip** (not table): “When to use gotrippin vs inbox apps” — **honest**, no trash talk.

### P2 — Growth frontend

5. **Blog route** (when ready): `/blog` or `/guides` — layout shell + first long-tail article (ties to `seo-search-intent-trip-planning-2026-04.md`).
6. **Open Graph image** — `seo.todo` Phase 2; **visual** marketing artifact, not code-default blank.

### P3 — Polish

7. **Unify auth-aware CTA** — server + client same source of truth (minor hydration consistency).
8. **Sticky “Start”** on mobile after scroll — A/B hypothesis only.

---

## 7. Performance & UX (marketing-specific)

- **Good:** Server hero copy; split `HomeBelowFold` chunks; `HeroMockupDeferred` keeps heavy UI out of initial JS budget (see comments in `HomeBelowFold.tsx`).
- **Watch:** Framer **whileInView** on many sections — acceptable; ensure **reduced motion** respected (already partially via `useReducedMotion`).
- **Images:** `next/image` on hero assets — good; keep **dimensions** stable for CLS.

---

## 8. Related docs & next studies

| Doc | Use |
|-----|-----|
| [`activation-aha-metrics-2026-04.md`](../product/activation-aha-metrics-2026-04.md) | What happens **after** CTA click |
| [`seo-search-intent-trip-planning-2026-04.md`](./seo-search-intent-trip-planning-2026-04.md) | What **content** to add next |
| [`tripsy-marketing-reference.md`](./tripsy-marketing-reference.md) | Section rhythm reference (patterns, not clone) |

**Round 2 — expanded crawl + “wild” spectrum:** [`marketing-frontend-crawl-round2-2026-04.md`](./marketing-frontend-crawl-round2-2026-04.md) (TripIt free, Linear, Awaii, Roadtrippers, GatherTrip, Vercel, Notion, Tripnotes acquisition, timeouts noted).

**Round 3 — scored rubric + live browser snapshots:** [`marketing-frontend-rubric-round3-2026-04.md`](./marketing-frontend-rubric-round3-2026-04.md) (Awaii, Linear, Plan Harmony, Wanderlog, Roadtrippers, gotrippin `/home`).

**Round 4 — saturation + B2B/vertical + idea buffet:** [`marketing-frontend-saturation-round4-2026-04.md`](./marketing-frontend-saturation-round4-2026-04.md).

**Round 4 — rubric extension (Komoot, Travefy, GYG, Pilot, outdoor, Perk, DOM):** [`marketing-frontend-rubric-round4-2026-04.md`](./marketing-frontend-rubric-round4-2026-04.md).

**Round 5 — Pilot / outdoor / Furkot / rebrand + ideas ×25:** [`marketing-frontend-saturation-round5-2026-04.md`](./marketing-frontend-saturation-round5-2026-04.md).

**Round 6 — Layla / TravelJoy / KAYAK Trips / Navan / Pebbls + rubric supplement:** [`marketing-frontend-saturation-round6-2026-04.md`](./marketing-frontend-saturation-round6-2026-04.md).

**Round 7 — Partiful / Luma / Meetup / Wanderboat (dual surface) + event adjacency:** [`marketing-frontend-saturation-round7-2026-04.md`](./marketing-frontend-saturation-round7-2026-04.md).

---

## 9. Changelog

| Date | Note |
|------|------|
| 2026-04-05 | Initial deep dive: competitor pattern taxonomy, gotrippin component map, gaps, P0–P3 recs |
| 2026-04-05 | Link to crawl round 2 doc |
