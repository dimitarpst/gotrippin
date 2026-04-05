# Marketing frontend — crawl round 2 (“more pages, more chaos”)

**Date:** 2026-04-05  
**Method:** Automated fetch of public marketing HTML (converted to text). Some URLs **timed out** or returned **minimal** content — noted below. **Not** a substitute for designer eye on screenshots; use for **IA, copy patterns, and section ideas**.

**Companion:** [`marketing-frontend-home-deep-dive-2026-04.md`](./marketing-frontend-home-deep-dive-2026-04.md) (Part I — taxonomy + gotrippin map) · [`marketing-frontend-rubric-round3-2026-04.md`](./marketing-frontend-rubric-round3-2026-04.md) (scored audit).

---

## 1. Crawl log

| URL | Result (2026-04-05) | Bucket |
|-----|---------------------|--------|
| [tripit.com/web/free](https://www.tripit.com/web/free) | OK — long-form + feature tiles | Travel / J1 |
| [linear.app](https://linear.app/) | OK — **maximal** product UI in page | Craft / “crazy good” |
| [tripnotes.ai](https://tripnotes.ai/) | OK — **acquisition stub** (→ Dorsia) | Dead / M&A |
| [pilotplans.com](https://www.pilotplans.com/) | Minimal text in fetch | Travel / group |
| [awaii.app](https://awaii.app/) | OK — **strong** narrative + FAQ | Group / iOS-first |
| [roadtrippers.com](https://roadtrippers.com/) | OK — **interactive** plan widget + SEO tail | Road / vertical |
| [stripe.com](https://stripe.com) | **Timeout** | Craft (retry later) |
| [gathertrip.com](https://www.gathertrip.com/) | OK — AI + SMS story | Group / AI maximal |
| [vercel.com/home](https://vercel.com/home) | OK — AI cloud + templates + code | Craft |
| [travelviz.ai](https://www.travelviz.ai/) | **Timeout** | AI travel |
| [notion.so/product](https://www.notion.so/product) | OK — AI workspace + calculator + proof | Craft / horizontal |

---

## 2. Travel & trip planners (what changed our picture)

### TripIt (`/web/free`)

- **Headline job:** “Find your plans in one place” — pure **J1**.
- **Structure:** H1 → primary CTA → **repeated benefit sections** with **labeled tiles** (Mobile Itinerary, Inbox Sync, Carbon Footprint, Travel Stats, Documents…).
- **Takeaway:** Incumbent **clarity** — each block is a **named outcome**, not vague “features.” Good template for **honest** capability lists when gotrippin lists **route, timeline, share, AI** without fluff.

### Roadtrippers

- **Hero is a tool:** **Starting point + Destination + Go** — visitor **does work** before scroll (plan trip / autopilot).
- **Below fold:** **Editorial + UGC** (“what roadtrippers are finding”), **magazine**, **famous routes** — massive **SEO tail** attached to the same domain.
- **Takeaway:** gotrippin is **not** a POI database; still useful to see **interactive hero** as alternative to static mockup. Risk: engineering cost. Opportunity: **tiny** interactive (e.g. “add two cities → see route concept”) as **future** experiment.

### Tripnotes

- **State of category:** Former AI trip angle **acquired**; landing is a **redirect narrative** to Dorsia.
- **Takeaway:** **J5-only** brands are **fragile**; aligns with strategy doc — don’t **be** Tripnotes, use AI **inside** J2.

### Pilot (homepage fetch thin)

- Treat as **signal to re-fetch** or inspect manually; likely **client-rendered** hero.

---

## 3. Group / collaborative — sharper narratives

### Awaii (high signal)

- **Headline:** “Move planning out of the group chat.” — **same enemy** as gotrippin (chaos).
- **Section rhythm:** **Why it works** → **Ideas / Where / When / Plan** (journey stages) → **After the trip** (retention hook).
- **Explicit comparison:** **Group chat vs Awaii** bullet table — extremely clear **substitute selling**.
- **FAQ + email capture** on marketing site; **iOS first**, web “exploring.”
- **Takeaway:** The **chat vs product** table is **frontend gold** — steal the **pattern** (not copy): one column pain, one column your model. Fits **Part F5** “why not Sheets” in strategy doc; could live as a **homepage section**.

### GatherTrip

- **Maximal story:** AI + **group chat integration** + **SMS without app** — many **bold claims** in one page (“ultimate source of truth,” natural language edits, boarding pass mock).
- **Visuals:** Inline **example utterances** as **H2-sized quotes** — “crazy” **demonstration-first** marketing.
- **Takeaway:** High **spectacle**; also **trust risk** if product under-delivers. gotrippin could borrow **quote-style examples** of **route + crew** (“Sofia → Madrid → home”) **without** promising SMS ingestion unless real.

---

## 4. “Craft” sites — patterns worth stealing (non-travel)

### Linear

- **Whole page = product simulation:** fake issues, agents, roadmap, diffs — **depth** that screams capability.
- **Numbered chapters** (1.0 Intake → 5.0 Monitor) — **saga** structure.
- **Changelog** on homepage + **customer quotes** + scale (“25,000 teams”).
- **Takeaway:** If gotrippin ever does **“live product”** marketing, this is the **bar** — not a static PNG. For **early** stage: **one** looping screen recording or **interactive** timeline beats **fake** chrome.

### Vercel

- **Hero:** outcome metrics in **one line** (“7m → 40s”) + **dual CTA** Deploy / Demo.
- **Tabs or switches** (AI Apps / Web Apps / …) to show **multi-persona** without separate pages.
- **Code snippet** + **model leaderboard** — **developer trust**.
- **Takeaway:** **Tabbed value props** could map to **Map | Timeline | Crew | AI** without four hero screens.

### Notion

- **Calculator** (“tool consolidation savings”) — **interactive engagement**.
- **Massive social proof** grid + **G2 / Fortune** stats.
- **Use-case cards** (“Plan an offsite”) — **direct** overlap with trip planning as **one tile**.
- **Takeaway:** **Offsite planning** is adjacent ICP; **calculator** is overkill for gotrippin short term; **use-case tiles** are feasible.

---

## 5. Spectrum — “boring → unhinged” (marketing energy)

Use this to **choose** brand energy deliberately.

| Position | Example from crawl | When it fits |
|----------|-------------------|--------------|
| **Calm / trust** | TripIt free page, Tripsy (Part I) | J1, incumbents, risk-averse users |
| **Clear enemy** | Awaii (chat vs app) | Group planners, gotrippin J2 |
| **Content + UGC tail** | Roadtrippers | SEO machines, not MVP |
| **Product-as-landing** | Linear | Mature product, design-heavy team |
| **AI maximalism** | GatherTrip | Hype, hard to defend if shallow |
| **Graveyard** | Tripnotes → Dorsia | Warning for AI-only positioning |

**gotrippin sweet spot (opinion):** **Awaii-level clarity** (enemy + comparison) + **lighter** spectacle than GatherTrip + **honest** product depth when you can show **real** route/timeline (Linear-lite, not Linear-full).

---

## 6. Concrete “crazy menu” — experiments (optional)

| Idea | Source DNA | Effort | Risk |
|------|------------|--------|------|
| **Chat vs gotrippin** two-column section | Awaii | Low (copy + layout) | Low if honest |
| **Tabbed hero** (Map / Timeline / Crew) | Vercel tabs | Medium | Needs real screens or good wire |
| **Micro planner** “A → B” teaser | Roadtrippers | High | Scope creep |
| **Quote-sized user utterances** | GatherTrip | Low | Cheesy if generic |
| **Changelog strip** on `/home` | Linear | Low | Only if shipping often |
| **Offsite / friends trip** use-case tile | Notion | Low | SEO + clarity |

---

## 7. Links back to gotrippin repo

- Implementing any of the above = **product + design** decision; align with [`market-strategy-idea-origin-deep-dive-2026-04.md`](./market-strategy-idea-origin-deep-dive-2026-04.md).
- **Activation** after CTA: [`activation-aha-metrics-2026-04.md`](../product/activation-aha-metrics-2026-04.md).

---

## 8. Changelog

| Date | Note |
|------|------|
| 2026-04-05 | Round 2 crawl: TripIt, Linear, Tripnotes, Pilot, Awaii, Roadtrippers, GatherTrip, Vercel, Notion; Stripe/TravelViz timeouts |
