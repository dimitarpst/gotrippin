# Marketing frontend — saturation crawl (Round 8)

**Date:** 2026-04-03  
**Intent:** **Retry megasites** that failed automated fetch in Round 7 — using **lighter entry URLs** where possible and **in-browser / real client** observation (not server-side scrape). **Roamaround** follow-up while **503** persists.

**Prior:** [Round 7](./marketing-frontend-saturation-round7-2026-04.md) · [Round 3 rubric](./marketing-frontend-rubric-round3-2026-04.md) · [Part I](./marketing-frontend-home-deep-dive-2026-04.md)

**Next:** [Round 9](./marketing-frontend-saturation-round9-2026-04.md) (rail aggregators, Seat61, Wanderlog Pro / PDFs)

---

## 1. Mega crawl log (this session)

| URL | Fetch (undici / MCP text) | Browser MCP | Bucket |
|-----|---------------------------|-------------|--------|
| [expedia.com](https://www.expedia.com/) | **OK** — hero + pillar nav | *Chrome error in automation tab* — treat as **environmental**; re-check locally | Mega OTA |
| [tripadvisor.com](https://www.tripadvisor.com/) | **Timeout** | Retry **in-browser** only; avoid `/Trips` first pass (heavier than home) | OTA / UGC |
| [tripadvisor.com/Trips](https://www.tripadvisor.com/Trips) | Timeout (Round 7) | Same rule: **home → Trips** after first paint if needed | Trip locker |
| [roamaround.com](https://www.roamaround.com/) | **503** (this session) | N/A until origin healthy | AI itinerary (Layla sibling) |

### Lighter URL playbook (megasites)

| Site | Heavier | Lighter first |
|------|---------|----------------|
| **TripAdvisor** | `/Trips`, deep app routes | **`/`** home, then follow visible “Trips” nav |
| **Expedia** | Logged-in trip board, long package URLs | **`/`** or category roots: [`/Hotels`](https://www.expedia.com/Hotels), [`/Flights`](https://www.expedia.com/Flights), [`/Vacation-Packages`](https://www.expedia.com/Vacation-Packages) |
| **Booking.com** | Search results with long querystrings | **`/`** (still often slow — same browser-only rule) |

**Rule:** Do not infer product UX from **failed** fetch; label **unknown** until a real browser session completes.

---

## 2. Deep dives

### 2.1 Expedia — home (successful text fetch)

- **H1 / promise:** “The one place you go to go places” — **category OS**, not trip narrative.
- **IA:** Stays / Flights / Cars / Packages / Things to do / Cruises — **transaction pillars** first; trip planning is implicit in **Packages** + merchandising, not a single “plan together” story on the fold.
- **Merch block:** “Last minute savings” + **Book now** — classic **E** (revenue path above editorial depth).
- **Takeaway for gotrippin:** Competing on **OTA breadth** is a different game; homepage SEO is **intent capture** (where/when/travelers). Our wedge stays **shared itinerary + route spine**; borrow **clear pillar nav** if we ever add flights/stays modules, not the whole grid.

### 2.2 TripAdvisor — deferred

- **Round 7:** `/Trips` timeout. **Round 8:** root also **timeout** on text fetch here.
- **Next check:** Local Chrome / Browser MCP when tab health is good; snapshot **ref count** + hero H1 + logged-out “Trips” entry.
- **Hypothesis to validate:** Trips product is **UGC + saves**; marketing story may be **smaller** than Expedia’s category wall.

### 2.3 Roamaround — still 503

- **Status:** Unchanged vs Round 7 — **no HTML body** to audit.
- **Changelog trigger:** When `GET /` returns **200**, add **Round 8b** one-pager or append §2.3 with screenshot + rubric row.

---

## 3. Rubric supplement (Round 8)

Same **A–F** scale as [Round 3](./marketing-frontend-rubric-round3-2026-04.md). Only **Expedia** scored from real content this pass.

| Surface | A | B | C | D | E | F | **Avg** | Notes |
|---------|---|---|---|---|---|---|---|-------|
| **Expedia /** | 5 | 5 | 3 | 4 | 5 | 4 | **4.3** | Strong **A/B/E**; **C** is promos not education; **F** dense but standard OTA |

**TripAdvisor / Roamaround:** no score until a successful load.

---

## 4. Idea buffet — ×10

1. **Megasite audit SOP:** home URL first → note **redirect chain** → then deep link (matches Wanderboat Round 7 lesson).  
2. **503 watchlist:** Roamaround + any AI trip agent that shares infra — monthly ping.  
3. **Expedia-style “pillar” row** on gotrippin only if product truly has those modules (no hollow tabs).  
4. **Last-minute** merchandising block — only if we have **real** deals or partner feed.  
5. **TripAdvisor Trips** — when captured, compare **collab** vs KAYAK Trips / gotrippin **timeline**.  
6. **Browser MCP** regression: if `chrome-error://chromewebdata/` → retry **outside** automation and paste notes back.  
7. **footer sitemap** peek (Expedia/TA) for **topic** gaps vs our `/home` sections.  
8. **Performance:** megasite **TTFB** is not our target; still avoid **blocking** hero on gotrippin.  
9. **Locale:** Expedia fetches may vary by edge — record **Accept-Language** when comparing copy.  
10. **Round 9:** advisor **PDF** exporters, or **rail** specialists — pick one lane.

---

## 5. Changelog

| Date | Note |
|------|------|
| 2026-04-03 | Round 8: Expedia home fetch OK; TripAdvisor timeout; Roamaround 503; lighter-URL playbook; rubric Expedia only; browser tab error noted |
