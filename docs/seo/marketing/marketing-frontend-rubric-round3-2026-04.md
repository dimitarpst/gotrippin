# Marketing frontend — rubric audit (Round 3)

**Date:** 2026-04-05  
**Method:** **Live browser pass** via Cursor IDE browser MCP: `browser_navigate` + accessibility **snapshot** (element tree) + **viewport screenshot** (model-generated image description). **Desktop** default viewport unless noted; **gotrippin** also checked at **390×844**.

**Scope:** Marketing homepages only (this pass).

**Companion docs:** [Part I — taxonomy](./marketing-frontend-home-deep-dive-2026-04.md) · [Round 2 — crawl notes](./marketing-frontend-crawl-round2-2026-04.md) · [Round 4 — saturation](./marketing-frontend-saturation-round4-2026-04.md) · [Round 4 — rubric + DOM](./marketing-frontend-rubric-round4-2026-04.md) · [Round 5 — saturation](./marketing-frontend-saturation-round5-2026-04.md) · [Round 6 — saturation + rubric supplement](./marketing-frontend-saturation-round6-2026-04.md) · [Round 7 — events adjacency](./marketing-frontend-saturation-round7-2026-04.md).

---

## 1. Scoring scale (each criterion 1–5)

| Score | Meaning |
|-------|---------|
| **1** | Missing or hurts trust / clarity |
| **2** | Present but weak, generic, or buried |
| **3** | Category-average |
| **4** | Strong; few gaps |
| **5** | Reference-tier for that criterion |

**Criteria**

| ID | Criterion | What we looked at |
|----|-----------|-------------------|
| **A** | **Hero clarity** | H1 + supporting line communicate job + audience in ~5s (snapshot headings + hero screenshot). |
| **B** | **CTA hierarchy** | Primary action obvious; secondary doesn’t compete; repeated CTAs OK if consistent. |
| **C** | **Proof density** | Stats, quotes, ratings, logos, “teams using” — **above or near fold** where possible. |
| **D** | **Narrative depth** | Distinct sections (problem → features → proof); not a thin template. |
| **E** | **Objection handling** | FAQ, comparison, privacy, pricing hints — **visible** on marketing URL. |
| **F** | **Craft / memorability** | Visual/typographic/system distinctiveness from screenshot description (subjective). |

**Caveats**

- Scores are **judgment calls** from one session; re-score after major redesigns.
- **Wanderlog** snapshot has **thousands** of nodes (long testimonial page) — criterion **D** reflects full page intent, not hero-only.
- **gotrippin** scored against **production intent**; local run may include dev UI (e.g. Next dev overlay) — ignore for scoring.
- **Cookie banners** (e.g. Roadtrippers) reduce first-impression clarity — noted but not double-penalized harshly.

---

## 2. Scores (Round 3 session)

| Site | URL | A | B | C | D | E | F | **Avg** | One-line rationale |
|------|-----|---|---|---|---|---|---|---|-------------------|
| **Awaii** | [awaii.app](https://awaii.app/) | 5 | 5 | 2 | 5 | 5 | 5 | **4.5** | Crystal enemy + chat vs product; FAQ + email; pastel craft; **light proof** in hero. |
| **Linear** | [linear.app](https://linear.app/) | 5 | 4 | 5 | 5 | 3 | 5 | **4.5** | Product-in-page = depth + craft; proof + changelog strong; **less classic FAQ**. |
| **Plan Harmony** | [planharmony.com](https://www.planharmony.com/) | 4 | 5 | 5 | 5 | 5 | 4 | **4.7** | Full funnel: stats, testimonials, FAQ **vs TripIt/Wanderlog**, footer comparisons — **reference** for group planner SEO pages. |
| **Wanderlog** | [wanderlog.com](https://wanderlog.com/) | 5 | 5 | 5 | 5 | 3 | 4 | **4.5** | Orange brand, dual CTA, phone mock, **press + wall of love**; DOM enormous. |
| **Roadtrippers** | [roadtrippers.com](https://roadtrippers.com/) | 5 | 4 | 2 | 4 | 2 | 4 | **3.5** | **Interactive hero** (modes + A→B) = standout **A/F**; proof light in fold; cookie bar noise. |
| **gotrippin** | `http://127.0.0.1:3000/home` | 5 | 5 | 1 | 4 | 3 | 4 | **3.7** | Copy **excellent**; **no proof widgets**; honest roadmap text = good **E** partial; hero visual variable; **56-node** tree = lean DOM vs Wanderlog. |

**Averages** are simple means (not weighted by business priority).

---

## 3. Evidence notes (per site)

### Awaii

- **Snapshot:** Single clear H1 (“Move planning out of the group chat”), structured H2 journey (ideas → where → when → plan), **Group chat vs Awaii** list contrast, **6 FAQ** disclosure buttons, email capture region.
- **Screenshot:** Left-aligned hero, mint waves, coral accent on “group chat,” App Store CTA, phone peek — **cohesive brand**.

### Linear

- **Snapshot:** **231** interactive nodes — fake workspace (issues, agents, roadmap, diffs). H1 + H2 “chapters.” Customer quotes + “25,000 product teams.” Footer dense.
- **Screenshot:** Minimal dark header in crop — real “wow” is **below** first pixel row; scoring uses full page role tree.

### Plan Harmony

- **Snapshot:** H1 + trust strip (“Trusted by…”, reviews, trips/month), **five** feature H3s + learn more links, testimonial carousel inputs (star radios), **FAQ** including **vs TripIt / Wanderlog**, destination footer links.
- **Screenshot:** White header, centered nav, soft gradient hero — **consulting-calm** aesthetic.

### Wanderlog

- **Snapshot:** **4278** total refs — extreme content + testimonial depth. Hero: Start planning + Get the app + See more reviews; press @mentions in tree.
- **Screenshot:** Centered headline, orange CTAs, phone mock “Kauai trip” — **classic** high-conversion travel app landing.

### Roadtrippers

- **Snapshot:** **350** refs; hero **radio** modes (Quick Launch / Autopilot), two textboxes, **Go** button — **tool-first**.
- **Screenshot:** Navy hero, serif headline, cookie banner **occupies** bottom — hurts first-run **E** clarity.

### gotrippin

- **Snapshot:** **56** refs — lean. H1 matches metadata; sections `#story`→together→bento visible as headings; placeholder line still in **map** narrative text (“Product screenshots in the hero…”).
- **Desktop vs mobile 390×844:** Same structural refs; nav shows compact **“Start”** + **Open menu** — aligns with `LandingNav` mobile work.
- **Screenshot:** Dark hero, white pill CTA, gold/ghost secondary — **distinct** from orange Wanderlog / pastel Awaii.

---

## 4. DOM size proxy (accessibility node count)

| Page | Approx. total refs (snapshot) | Note |
|------|-------------------------------|------|
| gotrippin `/home` | **56** | Lean marketing page |
| Awaii | 89 | Moderate |
| Plan Harmony | 157 | Rich but reasonable |
| Roadtrippers | 350 | Interactive + content |
| Linear | 231 | Heavy UI demo |
| Wanderlog | **4278** | Testimonial / content tail — **perf risk** on low-end mobile |

Use **Lighthouse** + **RUM** for real perf; this is only a **rough complexity** signal.

---

## 5. gotrippin — prioritized fixes from this audit

| Gap (from scores) | Action |
|-------------------|--------|
| **C = 1** | Add **honest** proof: GitHub activity, one real quote, beta count, or “built in public” — avoid fake G2 badges. |
| **E = 3** | Add **short FAQ** (4–6) + optional **vs sheets / vs inbox app** strip — Plan Harmony–style, truthful. |
| **Placeholder copy in body** | Remove or rewrite **map** section string so it doesn’t read “unfinished” mid-page. |
| **F (hero visual)** | Decide **premium real UI** vs **abstract route** — middle ground scores weak vs Wanderlog/Tripsy (see strategy doc). |

---

## 6. How to re-run this audit

1. Open Cursor browser; optional `browser_resize` 1440×900 and 390×844.  
2. Navigate each URL; `browser_snapshot` (compact optional).  
3. Optional `browser_take_screenshot` fullPage for archive.  
4. Update scores + **Changelog** table below.  
5. For **gotrippin**, use **staging/prod** URL when comparing to competitors (same network conditions).

---

## 7. Changelog

| Date | Note |
|------|------|
| 2026-04-05 | Initial Round 3: rubric, 6 sites scored, DOM notes, MCP methodology |
