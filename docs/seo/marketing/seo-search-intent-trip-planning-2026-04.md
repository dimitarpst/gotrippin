# SEO — search intent for trip planning (study log)

**Date:** 2026-04-04  
**Focus:** Query clusters around **shared / group / collaborative** planning, **SERP shape**, and **content gaps** for gotrippin. Complements [landing-hero-competitive-study-2026-04.md](./landing-hero-competitive-study-2026-04.md), [trip-planner-pricing-conversion-study-2026-04.md](./trip-planner-pricing-conversion-study-2026-04.md), and [aso-vs-web-seo-trip-planning-2026-04.md](./aso-vs-web-seo-trip-planning-2026-04.md) (app store vs web discovery).

**Method:** Web search synthesis + public SERP competitor landscape (not proprietary rank trackers). **Search volumes** are not cited here — use Google Search Console (post-indexing), Keyword Planner, or Ahrefs/Semrush for numbers.

---

## 1. Intent taxonomy (how to read queries)

| Intent | User job | Typical SERP winners | gotrippin fit |
|--------|----------|----------------------|---------------|
| **Commercial investigation** | Compare tools (“best group trip planner app”) | Roundup articles, App Store, big brands | Hard early; need **proof** + listings |
| **Transactional (tool)** | Start planning now | Product homepages, sign-up CTAs | **Strong** — `/home` + web app |
| **Informational (problem)** | Escape chaos of chats/sheets | Blogs, Reddit, templates, YouTube | **Content marketing** opportunity |
| **Navigational** | Open a known brand | Brand domain #1 | Build brand over time |

Most valuable **early** queries for a young product are often **long-tail informational** (“how to plan a group trip without losing your mind”) and **problem + tool** (“shared itinerary app for friends”), not raw **trip planner** alone.

---

## 2. Query clusters (group by language, not single keywords)

### A. Collaboration / crew (high alignment with gotrippin)

| Query family (EN examples) | Intent | Notes |
|----------------------------|--------|--------|
| group trip planner, group travel planner | Commercial + transactional | Crowded; Pilot, Plan Harmony, SquadTrip, Huddle, AI clones compete |
| plan a trip with friends, plan vacation with friends | Informational → commercial | Often answered by **templates**, **Reddit**, then apps |
| shared itinerary app, collaborative trip planner | Commercial investigation | App Store + SaaS landing pages |
| trip planning spreadsheet / Google Sheets template | Informational | **Alternative “competitor”** — sheets rank well; good **comparison** angle |

### B. Itinerary + logistics (partial overlap)

| Query family | Intent | Notes |
|--------------|--------|--------|
| travel itinerary app, trip itinerary maker | Commercial | TripIt / Tripsy / Wanderlog territory |
| road trip planner | Mixed | Map/route story fits; seasonal spikes |

### C. AI-specific (noisy, fast-moving)

| Query family | Intent | Notes |
|--------------|--------|--------|
| AI trip planner, AI itinerary generator | Commercial + experimental | Many thin tools; **trust** and **specific use cases** matter; align claims with product |

### D. Bulgarian (defer until locale strategy)

Mirror **problem** and **tool** phrasing (e.g. планиране на пътуване с приятели, споделен маршрут) — validate in Keyword Planner / GSC once BG pages or hreflang exist. See `docs/seo/seo.todo` Phase 5–6.

---

## 3. SERP features to expect (shape of the battlefield)

- **App packs / Play & App Store** — many planning queries surface **mobile apps**; web-first products need **clear “use on web”** messaging and strong **branded** queries.
- **Listicles & affiliates** — “best X apps” dominate **head** terms; earning placement = **outreach** + **differentiation**, not only on-page SEO.
- **People Also Ask** — tends toward **how-to** and **problems** (“how do I split expenses on a group trip?”). Good fuel for **FAQ / blog** if answers are **on-page and honest**.
- **AI Overviews / AI Mode (Google)** — for travel planning, **synthetic answers** may reduce clicks to generic guides; **specific**, **structured**, **tool-unique** pages survive better than vague “top 10 tips.” Industry commentary: see e.g. [Ranktracker on AI Mode for travel](https://ranktracker.com/blog/google-ai-mode-for-travel-websites/), [Smartvel playbook on AI Overviews](https://www.smartvel.com/resources/blog/playbook-2026-seo-for-location-pages-and-ai-overviews-in-travel) — treat as **directional**, not guaranteed.

---

## 4. Content gaps (opportunities)

| Gap | Idea | Risk / guardrail |
|-----|------|------------------|
| **Sheets vs app** | One page or section: “When spreadsheets break” → one shared route + timeline | Must be **truthful** to product |
| **Group decision fatigue** | Article: voting, deadlines, single source of truth — CTA to product | Don’t promise features you don’t ship |
| **Comparison** | “gotrippin vs Wanderlog vs group chat” (opinionated, fair) | Legal tone; no trademark misuse |
| **Use-case landing** | “Bachelor party itinerary,” “family reunion trip” — long-tail | Only if you can support **unique** copy per use case |
| **Structured how-tos** | H2/H3 that match PAA-style questions | Helps humans + **extractability** for AI summaries |

---

## 5. On-page mapping (ties to `docs/seo/seo.todo` Phase 1)

| Element | Suggested role |
|---------|----------------|
| **Title / H1** | One primary phrase + brand; avoid stuffing — hero research already locks **emotional** H1; ensure **title** carries 1 plain keyword (e.g. trip planner, shared trip) |
| **First screen subcopy** | Answer “who it’s for” + **collaboration** or **route** in natural language |
| **Section headings** | Use **problem/solution** language users search (chaos, one place, map, timeline) |
| **Future `/blog` or `/guides`** | Capture informational intent; keep **crawlable HTML** (already noted in seo.todo Phase 3) |

---

## 6. Measurement (when live)

1. **GSC:** Queries containing *group*, *shared*, *friends*, *itinerary*, *planner*, *trip*.  
2. **CTR:** Improve titles/snippets for high-impression, low-click queries.  
3. **Conversions:** Landing segment by `utm` or first path — which intents actually **sign up**.

---

## 7. Changelog

| Date | Note |
|------|------|
| 2026-04-04 | Initial study: intent taxonomy, query clusters, SERP notes, content gaps, on-page map |
