# Marketing frontend — saturation crawl (Round 5)

**Date:** 2026-04-03  
**Intent:** Add **outdoor adjacency**, **booking-heavy** consumer apps, **corporate travel**, **legacy road-trip** depth, and **AI-distribution** patterns. Pair with [Round 4 rubric extension](./marketing-frontend-rubric-round4-2026-04.md) for scores + DOM counts.

**Prior:** [Part I](./marketing-frontend-home-deep-dive-2026-04.md) · [Round 2](./marketing-frontend-crawl-round2-2026-04.md) · [Round 3 rubric](./marketing-frontend-rubric-round3-2026-04.md) · [Round 4](./marketing-frontend-saturation-round4-2026-04.md)

**Next:** [Round 6](./marketing-frontend-saturation-round6-2026-04.md) (AI + OTA + Navan a11y)

---

## 1. Mega crawl log (this session)

| URL | Result | Bucket |
|-----|--------|--------|
| [tripsy.com](https://www.tripsy.com/) | **Timeout** | Consumer planner |
| [pilotplans.com](https://www.pilotplans.com/) | OK (fetch thin title; **browser** rich) | **Booking + planning** |
| [outdooractive.com/en](https://www.outdooractive.com/en/) | OK | Outdoor / EU platform |
| [alltrails.com](https://www.alltrails.com/) | OK | Trails / US gravity |
| [inspirock.com](https://www.inspirock.com/) | **Timeout** | Itinerary generator |
| [maps.sygic.com](https://maps.sygic.com/) | OK — **Tripomatic** shell, “AI Trip Planner,” version string | Legacy brand / app funnel |
| [rome2rio.com](https://www.rome2rio.com/) | **Timeout** | Transport graph |
| [travelperk.com](https://www.travelperk.com/) | Redirect to **[perk.com](https://www.perk.com/)** (rebrand) | B2B travel + spend |
| [furkot.com](https://www.furkot.com/) | OK — **wizard + long onboarding copy** on home | Road trip / dates |
| [tripit.com](https://www.tripit.com/) | OK fetch (20th anniversary, forward-to-inbox story); **browser = cookie wall** | Itinerary inbox |

---

## 2. Deep dives

### 2.1 Pilot — “do everything” competitor page

Pilot’s homepage is a **full-funnel marketing engine**: **As featured in**, **stats** (“183 countries,” “60% very disappointed” to lose Pilot), **three pillars** (instant trips / plan / book), **group hotel** and **agency discount** story, **FAQ** with long-tail questions, and meta affordances (**“Hey AI, learn about us”**, **Copy This Page as Markdown**, links to ChatGPT / Perplexity / Claude / Google AI / Grok). **Takeaway:** If gotrippin wants **SEO + LLM recall**, Pilot is the **current bar** for **explicit** AI distribution hooks (without copying tone).

### 2.2 Outdooractive vs AllTrails vs Komoot (triangle)

- **Outdooractive:** **B2B + B2C** story (“only company… full SaaS… uniting tourism industry”), **values** block (Trust, Pioneering, …), **partner** logos, **feature wall** (GPX, BuddyBeacon, offline, topo maps). EU / DACH energy.
- **AllTrails:** **Consumer** search hero, **partner trail collections**, **top cities/parks/trails** grids, **gear** CTA — **less** B2B on home.
- **Komoot:** Already in Round 4 — **collections + stats**; Outdooractive is **even more** “industry platform” on the **same** landing.

**Takeaway:** gotrippin is **none** of these; borrow at most **one** stat + **one** curated list, not a taxonomy of sports.

### 2.3 Perk (formerly TravelPerk)

Corporate **travel + expense + invoice** in one narrative (“shadow work,” AI, tabs for use cases). **Trust:** “Trusted by 1,000s of global teams.” **Takeaway:** Phrasing for **pain** is sharp; **ICP** is wrong for gotrippin — use for **copy structure**, not positioning.

### 2.4 Furkot — honest “tool” landing

Heavy **instructional** copy: sign-in panel + **how routing, overnight stops, modes, AllTrails/Wikipedia** integrations work. Feels like **2000s product love** + **docs on home**. **Takeaway:** For a **route-first** app, a **short** “how it works” strip beats vague superlatives; avoid Furkot-level length on marketing home.

### 2.5 TripIt (fetch vs browser)

- **Fetch:** Full marketing story (forward emails, Pro, quotes, blog teasers).
- **Browser (this session):** **Cookie modal** dominated the accessibility tree → **Round 4** scores TripIt as **N/A** until consent.

### 2.6 Sygic / Tripomatic fetch

`maps.sygic.com` returns a minimal **Tripomatic – AI Trip Planner** title + premium upsell + version — likely **app/deep link** surface, not a full web competitor audit.

---

## 3. Pattern matrix (Round 5)

| Pattern | Examples | gotrippin lens |
|---------|----------|----------------|
| **AI distribution footer** | Pilot (LLM + markdown) | Optional `/llms.txt` + one “About” paragraph later |
| **Outdoor industry values** | Outdooractive | Only if brand truth (sustainability, safety) |
| **Cookie-first a11y** | TripIt | Always **accept** in competitor browser passes |
| **Rebrand redirect** | TravelPerk → Perk | Check **canonical** URLs when citing competitors |
| **Long tool prose** | Furkot | Move depth to **/how-it-works**, not hero |

---

## 4. Idea buffet — another 25 (cumulative with Round 4)

1. **/llms.txt** + human **/about** mirroring Pilot’s “learn about us” but shorter.  
2. **One** “export as markdown” of **public** marketing page (static).  
3. **Cookie-banner UX** audit: ensure product isn’t **invisible** to a11y tree pre-consent.  
4. **“How we’re not Pilot / not Wanderlog”** honest comparison (5 bullets).  
5. **Road-trip** landing variant (Furkot wedge) if SEO data supports it.  
6. **Outdoor** subpage only if you ship trail/GPX later.  
7. **Press strip** (“As seen in”) only with **real** logos.  
8. **Retention stat** if measured (“X% return for a second trip”).  
9. **Time-to-first-route** benchmark in copy if fast.  
10. **Embed** a single **read-only** trip iframe for press.  
11. **Partner** one national park NGO? (only if authentic).  
12. **Seasonal** FAQ (“hurricane season,” “ski week”).  
13. **Visa / docs** mention only if product supports it.  
14. **Print CSS** brag for timeline (already product direction).  
15. **Keyboard** “skip to planner” on marketing.  
16. **hreflang** when BG marketing goes beyond UI strings.  
17. **RSS** for changelog (Linear-adjacent).  
18. **OG video** 6s silent loop of map (heavy; test).  
19. **Community** Discord link if moderated.  
20. **Security** one-pager (RLS simplified).  
21. **DPA** page for EU teams (future B2B).  
22. **“Built without”** list (no fake reviews, no dark patterns).  
23. **Screenshot** monthly refresh ritual.  
24. **Contrast** audit badge in footer.  
25. **“Replaces”** icon row: Sheets, WhatsApp, Apple Maps (truth-checked).

---

## 5. Changelog

| Date | Note |
|------|------|
| 2026-04-03 | Round 5: Pilot, Outdooractive, AllTrails, Perk redirect, Furkot, TripIt/Sygic notes, timeouts, ideas ×25 |
| 2026-04-03 | Link forward to Round 6 |
