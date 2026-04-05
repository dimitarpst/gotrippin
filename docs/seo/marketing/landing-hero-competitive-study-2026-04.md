# Landing hero — competitive market study (log)

**Date:** 2026-04-04  
**Canonical strategy (full market + JTBD + positioning):** [`market-strategy-idea-origin-deep-dive-2026-04.md`](./market-strategy-idea-origin-deep-dive-2026-04.md) — read that first; this file focuses **hero format and competitor presentation patterns**.

**Why:** Stakeholder feedback: the current hero (product screenshots inside a desktop-style chrome + map/timeline split) does not feel sufficiently **intriguing or engaging**; openness to **not** relying on marketing photos. This document **studies how similar products present themselves** and proposes **strategic directions** for gotrippin’s `/home` hero.

**Method (not a full crawl):** Manual review via public fetches + web search of positioning. Pages consulted in this pass:

| URL | Role in landscape |
|-----|-------------------|
| [tripsy.app](https://tripsy.app/) | Mature “all-in-one itinerary” + Apple ecosystem; email-forward automation story |
| [wanderlog.com](https://wanderlog.com/) | Map + itinerary in one view; heavy testimonials; “1M+ users” proof |
| [tripit.com](https://www.tripit.com/) | Incumbent “forward email → itinerary”; trust / longevity / Pro upsell |
| [triplanly.com](https://www.triplanly.com/) | **Group-first** headline; collaboration + visual itinerary; AI “coming soon” |
| [planors.com](https://www.planors.com/) | **Group-first**; explicit “broken planning” narrative; pricing on marketing site |

**Related internal docs:** [hero-tagline-research.md](./hero-tagline-research.md) (copy / “chaos” line), [tripsy-marketing-reference.md](./tripsy-marketing-reference.md) (Tripsy IA + visual patterns), [trip-planner-pricing-conversion-study-2026-04.md](./trip-planner-pricing-conversion-study-2026-04.md) (pricing tiers, paid “job,” web vs app conversion), [seo-search-intent-trip-planning-2026-04.md](./seo-search-intent-trip-planning-2026-04.md) (query clusters, SERP shape, content gaps), [collaboration-mechanics-competitive-2026-04.md](./collaboration-mechanics-competitive-2026-04.md) (invites, permissions, voting, sync claims), [aso-vs-web-seo-trip-planning-2026-04.md](./aso-vs-web-seo-trip-planning-2026-04.md) (ASO vs web SEO, store listing policy).

---

## 1. Market segments (same “trip planning” aisle, different center of gravity)

| Segment | Primary promise | Hero tends to… | Examples |
|--------|------------------|----------------|----------|
| **A. Itinerary consolidation** | One place for bookings, emails, documents | Automation story + device UI + trust | TripIt, Tripsy |
| **B. Map + plan fusion** | Stop switching between Maps and notes | “One app” + map/itinerary visual + social proof wall | Wanderlog |
| **C. Group / collaborative** | No more group chat / spreadsheet chaos | **Pain headline** + collaboration bullets + simple CTA; lighter on glossy UI chrome | Triplanly, Planors, Plan Harmony (from prior research) |
| **D. AI-forward** | Plan from a prompt / smart suggestions | Feature cards, “coming soon” blocks, assistant framing | Triplanly (AI section), Wanderlog (reviews mention AI) |

**gotrippin (product truth today):** Strong overlap with **B** (route + map) and **C** (shared trip, alignment), with **AI** as assist—not magic trip generation. That sits slightly **aside** from TripIt/Tripsy’s core story (**email ingestion**), unless you later emphasize imports.

---

## 2. Hero *formats* observed (what competitors actually show above the fold)

| Pattern | Engagement tradeoff | Who uses it |
|---------|---------------------|-------------|
| **Large device mockup + real UI** | High “this is a product” signal; risk of **generic** if UI looks like everyone else’s map | Tripsy, Wanderlog (implied from structure + reviews) |
| **Headline + subcopy + CTA, minimal visual** | Fast to ship; relies on **copy strength** and brand | Smaller collab tools often lean text-first |
| **“Problem / broken” section early** | Emotional hook without needing perfect screenshots | Planors (“Why travel planning is broken”) |
| **Testimonial wall** | Proof without showing product; needs real quotes eventually | Wanderlog (very heavy) |
| **Fake browser / OS chrome around screenshots** | Reads “marketing composite”; can feel **inauthentic** if assets are placeholders or overly polished | Internal: gotrippin’s previous direction — stakeholder pushback is consistent with category fatigue |

**Insight:** The **browser chrome + static panes** pattern is not wrong per se, but it **competes with Tripsy/Wanderlog-class polish**. Without **distinctive** visuals or motion, it often feels like a **template** rather than a memorable hook—especially if photography/screens are optional.

---

## 3. Positioning lines (snapshots from this pass)

- **Tripsy:** “All your trip details. Finally, in one place.” + “You book it. Tripsy builds it.” (automation)
- **Wanderlog:** “One app for all your travel planning needs” + “Your itinerary and your map in one view”
- **TripIt:** “Organize Your Travel Itinerary Automatically” + forward-to-email mechanic
- **Triplanly:** “Plan unforgettable trips with your group” + anti-chat / anti-spreadsheet
- **Planors:** “Plan your next trip. Together.” + “Make collaborative trip planning effortless”

**Overlap:** “Together” and “one place” are **table stakes**. Differentiation tends to come from **named pain** (chaos, chats, spreadsheets) or **mechanism** (email forward, map+list fusion, voting).

---

## 4. Strategic options for gotrippin’s hero (if photos are optional or deprioritized)

These are **mutually combinable** (e.g. A + D).

| ID | Strategy | Hero idea | Fits gotrippin when… |
|----|----------|-----------|----------------------|
| **A** | **Copy-led minimal hero** | Strong H1 (keep chaos angle) + 1 short subline + primary/secondary CTA; **no** fake OS chrome | You want clarity and speed; visuals live **below** the fold |
| **B** | **Pain narrative band** | Short “why planning breaks” (3 bullets: chats, versions, tabs) → then product sections | You want emotional alignment without product PNGs |
| **C** | **Abstract product metaphor** | Animated route line, schematic map path, or **blurhash/gradient + UI silhouette** — not literal screenshots | You want motion and brand without committing to screenshot maintenance |
| **D** | **Interactive teaser** | Tiny embedded map or “build one stop” demo (high effort) | You have engineering bandwidth for a **differentiated** hook |
| **E** | **Honest “web app” frame** | Single real browserless full-bleed UI crop or looped screen recording — **no** decorative fake window | You later have **one** killer capture or video, not a composite |

**Recommendation (2026-04-04):** Prefer **A + B** short term: **drop or simplify the decorative Mac/browser chrome** (it amplifies comparison to better-funded visual marketing), lead with **headline + proof of problem**, then let **structured sections** (map, timeline, AI, sharing) carry product story. Add **C** (light motion / abstract route) if the page feels flat without any visual anchor. **Defer E** until there is a **single** high-quality asset you’re proud of—optional, not mandatory.

**Explicit non-goal:** Chasing Tripsy-level **device hero** without comparable photography and brand craft usually **lowers** perceived quality; better to be **intentionally minimal** than **imitation composite**.

---

## 5. Open questions / next validation

- [ ] Confirm primary ICP for `/home`: **group leisure** vs **solo** vs **small team** — Triplanly/Planors skew group; TripIt skews frequent flyer.
- [ ] Decide whether to **ever** anchor on **email/import** (competes directly with incumbents) vs **route + shared truth** (more differentiated).
- [ ] If removing hero imagery, run one **5-second test** (UsabilityHub / internal) on headline + subline alone vs headline + abstract animation.

---

## 6. Changelog

| Date | Note |
|------|------|
| 2026-04-04 | Initial log: segment map, hero-format analysis, strategic options A–E, recommendation |
