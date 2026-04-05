# Marketing frontend — rubric audit (Round 4 extension)

**Date:** 2026-04-03  
**Method:** Same **A–F** scale as [Round 3](./marketing-frontend-rubric-round3-2026-04.md). **Live browser** via Cursor IDE browser MCP: `browser_navigate` (each navigation returns accessibility snapshot metadata). **Desktop** viewport; no mobile resize this pass.

**Scope:** Sites from [Round 4 saturation](./marketing-frontend-saturation-round4-2026-04.md) plus **direct competitors** and **adjacent verticals** (outdoor, corporate travel). **gotrippin** checked at `http://127.0.0.1:3000/home` (dev server).

**Companion docs:** [Round 3](./marketing-frontend-rubric-round3-2026-04.md) · [Round 4 saturation](./marketing-frontend-saturation-round4-2026-04.md) · [Round 5 saturation](./marketing-frontend-saturation-round5-2026-04.md) · [Round 6 saturation + rubric supplement](./marketing-frontend-saturation-round6-2026-04.md) · [Round 7 saturation](./marketing-frontend-saturation-round7-2026-04.md)

---

## 1. Scores (Round 4 session)

| Site | URL (requested) | A | B | C | D | E | F | **Avg** | Total refs | One-line rationale |
|------|-----------------|---|---|---|---|---|---|---|------------|-------------------|
| **Komoot** | [komoot.com](https://komoot.com/) | 5 | 5 | 5 | 5 | 3 | 4 | **4.5** | **750** | Adventure job + app CTAs + big stats; SEO matrix = depth; light classic FAQ on home. |
| **Travefy** | [travefy.com](https://travefy.com/) | 5 | 5 | 4 | 3 | 4 | **1** | **3.7** | **190** | Strong B2B hero + FAQ + “30,000+ brands”; **placeholder copy live in a11y tree** tanks **F** (and hurts **D**). |
| **GetYourGuide** | [getyourguide.com](https://www.getyourguide.com/) | 5 | 5 | 5 | 3 | 2 | 4 | **4.0** | **68** | Transaction clarity + review-rich cards; homepage is thin “shell” vs long story; **E** light on marketing URL. |
| **Planapple** | [planapple.com](https://www.planapple.com/) | 4 | 4 | 2 | 4 | 4 | 3 | **3.5** | **65** | Warm long-copy + video/sample trip links; **few numeric proofs**; vintage **F**. |
| **Triplanly** | [triplanly.com](https://www.triplanly.com/) | 5 | 4 | 2 | 3 | 2 | 3 | **3.2** | **35** | Clear group H1; **“1000+ groups” not in snapshot** (likely visual/non-a11y); thin **E**, generic **F**. |
| **AllTrails** | [alltrails.com](https://www.alltrails.com/) | 5 | 5 | 4 | 5 | 3 | 4 | **4.3** | **201** | Search + carousel + city/park grids; cookie friction; outdoor **craft** strong. |
| **Outdooractive** | [outdooractive.com/en](https://www.outdooractive.com/en/) | 5 | 4 | 4 | 5 | 4 | 3 | **4.2** | **250** | Activity taxonomy + long feature/value blocks + B2B line; busy **F**. |
| **Perk** (ex–TravelPerk) | [travelperk.com](https://www.travelperk.com/) → [perk.com](https://www.perk.com/) | 5 | 5 | 4 | 5 | 4 | 5 | **4.7** | **440** | Enterprise “travel + spend” rebrand; dense product story + proof strip; **redirect** note below. |
| **Pilot** | [pilotplans.com](https://www.pilotplans.com/) | 5 | 5 | 5 | 5 | 5 | 4 | **4.8** | **188** | Stats + quotes + FAQ + “replaces tools”; **AI/SEO** affordances; playful **F** (excuse generator, etc.). |
| **gotrippin** | `http://127.0.0.1:3000/home` | 5 | 5 | 1 | 4 | 3 | 4 | **3.7** | **56** | Same story as Round 3: **placeholder line** still in map section in tree; **C** weak; very lean DOM. |

### TripIt — snapshot caveat (no fair A–F)

Navigating [tripit.com](https://www.tripit.com/) in this session yielded **Total refs: 10** with only the **cookie consent** surface exposed in the accessibility tree (no product H1). **Do not** compare scores until after consent in a real pass. **Lesson:** competitor audits must **accept cookies** (or use fetch/HTML) before scoring.

---

## 2. DOM size proxy (Round 3 + Round 4 combined)

| Page | Approx. total refs | Note |
|------|--------------------|------|
| Wanderlog (R3) | **4278** | Long-tail content |
| **Perk** | **440** | Heavy marketing + repeated tab blocks |
| **Komoot** | **750** | Large link matrix still &lt; Wanderlog |
| Outdooractive | 250 | |
| AllTrails | 201 | |
| Pilot | 188 | |
| Travefy | 190 | Placeholders inflate *trust* cost, not necessarily node count |
| gotrippin `/home` | **56** | Lean |
| GetYourGuide | **68** | Deceptively small a11y tree (cards may under-expose) |
| Planapple | 65 | |
| Triplanly | **35** | Very small tree |
| TripIt (pre-consent) | **10** | Cookie gate only |

---

## 3. Evidence highlights

### Travefy — placeholder in the tree

Snapshot headings include literal strings: *“This is a bold value point . And then this is where supporting text will go.”* repeated under **Power your brand** / **Reduce costs**. This is **worse** than missing copy: it signals **unfinished launch** to anyone using reader mode, search bots parsing headings, or QA.

### Perk / TravelPerk — redirect

Requesting `travelperk.com` landed on **`perk.com`** with title *“The intelligent platform for travel and spend | Perk”*. Scores apply to **that** URL’s experience. Positioning is **corporate travel + spend**, not leisure crew planning — useful for **language** (“shadow work,” consolidation) only.

### Pilot — marketing machinery

Pilot exposes **FAQ** tuned for SEO, **numeric** claims (e.g. “183 countries,” “60% very disappointed”), **“Hey AI, learn about us”** + **markdown export** links, and **LLM vendor** shortcuts (ChatGPT, Perplexity, …). High **C/D/E** reference for an indie team willing to invest in **distribution**.

### gotrippin — still-flagged copy

Snapshot still includes: *“Product screenshots in the hero above are placeholders…”* under the map narrative. Aligns with Round 3 **gap**: remove or replace when real shots ship.

---

## 4. Changelog

| Date | Note |
|------|------|
| 2026-04-03 | Round 4 extension: 9 scored sites + TripIt caveat; DOM table; Travefy/Pilot/Perk notes |
| 2026-04-03 | Companion link: Round 6 (Layla, TravelJoy, KAYAK Trips, Navan scores) |
