# ASO vs web SEO — trip planner discovery (study log)

**Date:** 2026-04-04  
**Audience:** gotrippin is **web-first** today (Next.js `/home`, app routes); **React Native** is on the roadmap per `docs/BACKEND_FRONTEND_MOBILE_AUDIT.md`. This note clarifies **when App Store Optimization (ASO)** matters vs **web SEO**, and how they **interact** for travel/trip products.

**Related:** [seo-search-intent-trip-planning-2026-04.md](./seo-search-intent-trip-planning-2026-04.md) (SERP shape, query clusters), [trip-planner-pricing-conversion-study-2026-04.md](./trip-planner-pricing-conversion-study-2026-04.md) (web vs app conversion paths).

---

## 1. Two different “search engines”

| Dimension | **Web SEO** (Google, Bing, …) | **ASO** (App Store + Google Play) |
|-----------|------------------------------|-----------------------------------|
| **Inventory** | URLs (pages, articles, docs) | One listing per app (per locale) |
| **Primary levers** | Crawlable content, internal links, backlinks, Core Web Vitals, structured data | **Title, subtitle/short text, keywords (iOS), long description (Android), category, creatives, ratings** |
| **Trust / authority** | Domains, mentions, E-E-A-T-style signals | **Review volume & star average**, update cadence, install/engagement **velocity** (exact weighting is opaque) |
| **Intent match** | Long-tail questions, guides, tool landing pages | “Trip planner app”, “itinerary”, brand name; **high competition** in Travel |
| **Policy surface** | Thin content, spam links | **Strict metadata rules** (especially Play — see §4) |

**Overlap (bridge):** Google can surface **app results** (install buttons, app packs) in web SERPs; a strong **website** can support **brand search** that later converts in the store. Some teams also use **Smart App Banners** / web-to-app flows — still anchored in **web SEO + CRO** first.

---

## 2. iOS vs Android ASO (different rules)

| Field | **Apple App Store** (typical) | **Google Play** |
|-------|------------------------------|-----------------|
| **Title** | Very short; brand + **one** strong keyword is common practice | Short title; similar discipline |
| **Keyword targeting** | Dedicated **keyword field** (hidden from users) — iOS-specific craft | **No** separate keyword field; relevance signals from **title, short description, full description** (algorithm details are proprietary) |
| **Creatives** | Icons, screenshots, preview video — heavy **CVR** impact | Same + **feature graphic**; device-specific screenshot sets |
| **Third-party lore** | Vendors claim **screenshot text / OCR** may influence discovery; **treat as experimental** until validated in your own console experiments | Play’s own docs stress **clear, honest copy** — not keyword dumps (§4) |

For **both** stores: **first 1–3 screenshots** do most of the persuasion; align copy with **one primary job** (e.g. shared route + timeline, not ten features).

---

## 3. Trip planner category — how discovery splits

- Queries like **“trip planner app”** or **“best travel planner app”** often pull **App Store / Play / roundups** — hard to win on **web alone** for those exact strings.
- Queries like **“plan a trip with friends”**, **shared itinerary**, **how to organize group travel** pull **blogs, Reddit, templates, YouTube** — **web SEO + content** can compete earlier.
- **Brand + “gotrippin”** should eventually dominate navigational search; **web** is the natural home for that until the app is ubiquitous.

**Implication for sequencing:** Invest in **web SEO + truthful landing** now; add **ASO** as a **parallel track** when native binaries ship, reusing **messaging** (chaos, one shared trip, map + timeline) so store and site don’t contradict each other.

---

## 4. Google Play — official listing guidance (trust + compliance)

Google explicitly asks developers to:

- Describe functionality **accurately**; lead with value; **users may only read the first few sentences**.  
- Avoid **excessive repetition**, **lists of unrelated keywords**, and **unattributed testimonials**; avoid **“best” / “#1”** style claims in descriptions.  
- Keep graphics **minimal text**; no misleading icons or fake “official” implications.

Source: [Best practices for your store listing](https://support.google.com/googleplay/android-developer/answer/13393723) (Play Console Help).

**Lesson:** Play ASO is **not** “stuff 50 synonyms in the description” — that risks **policy** and poor UX. Natural language + **feature truth** (matches gotrippin’s product ethics).

---

## 5. Recommended strategy for gotrippin (by phase)

| Phase | Priority | Actions |
|-------|----------|---------|
| **Now (web-only)** | **Web SEO** | Homepage + future guides; GSC; JSON-LD `WebApplication` / `SoftwareApplication` when ready (`docs/seo/seo.todo` Phase 2); brand queries |
| **Native v1 shipping** | **Web + ASO** | **Same value prop** as `/home`; localized store listings; screenshot story = **route + timeline + (honest) sharing**; prompt **happy users** for ratings without incentivized fake reviews |
| **Scale** | **Both + paid optional** | Apple Search Ads / UAC only if unit economics work; **web content** for long-tail and AI-overview resilience |

---

## 6. Metrics — don’t compare apples to oranges

| Channel | North stars (examples) |
|---------|-------------------------|
| **Web** | GSC impressions/clicks, engaged sessions, sign-ups from organic landing |
| **ASO** | Store listing **conversion rate** (impression → product page → install), **keyword ranks** in console tools, **review score** trend |

A **+40% “organic discovery”** style stat sometimes cited for “web + app” stacks is **vendor-sourced** — use your own **attribution** (UTM, first-touch) instead.

---

## 7. Further reading (non-official but useful)

- [Apptweak: ASO vs SEO](https://www.apptweak.com/en/aso-blog/aso-vs-seo-why-how-they-are-different) — conceptual split.  
- [Ranktracker: overlap](https://www.ranktracker.com/blog/aso-vs-seo-where-they-overlap-where-they-don-t-and-why-you-need-both/) — unified acquisition framing.

Always cross-check **Apple App Store Connect** and **Play Console** current field limits and policies before publishing.

---

## 8. Changelog

| Date | Note |
|------|------|
| 2026-04-04 | Initial study: ASO vs SEO table, iOS/Android differences, trip category split, Play official guidance, phased recommendation |
