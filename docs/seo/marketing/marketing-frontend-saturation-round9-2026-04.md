# Marketing frontend — saturation crawl (Round 9)

**Date:** 2026-04-03  
**Intent:** **Rail & multimodal aggregators** (Trainline, Omio, Eurail, Rail Europe), **editorial rail authority** (Seat61), and **PDF / file adjacency** via **Wanderlog Pro** (attachments vault — not a dedicated “export PDF” landing page).

**Prior:** [Round 8](./marketing-frontend-saturation-round8-2026-04.md) · [Round 3 rubric](./marketing-frontend-rubric-round3-2026-04.md) · [Part I](./marketing-frontend-home-deep-dive-2026-04.md)

**Next:** [Round 10](./marketing-frontend-saturation-round10-2026-04.md) (Roadtrippers, Polarsteps, TripIt; TA 403; Roamaround 503)

---

## 1. Mega crawl log (this session)

| URL | Result | Bucket |
|-----|--------|--------|
| [thetrainline.com](https://www.thetrainline.com/) | **OK** — search + savings hero + Eurail/Japan modules + FAQ + mega-footer SEO | **Rail + bus** OTA |
| [omio.com](https://www.omio.com/) | **OK** — multimodal search + app + long tail routes (train/bus/flight/ferry) | **Multimodal** aggregator |
| [eurail.com/en](https://www.eurail.com/en) | **Thin** fetch — title/metadata only in pass (retry in-browser for body) | **Pass** seller |
| [raileurope.com/en](https://www.raileurope.com/en) | **Timeout** | Rail reseller |
| [seat61.com](https://www.seat61.com/) | **OK** — classic guide hub (multi-H1, country matrix) | **Editorial** / SEO moat |
| [wanderlog.com](https://wanderlog.com/) | **OK** — planner marketing; **Pro** lists PDFs/attachments | Trip planner **+ files** |

---

## 2. Deep dives

### 2.1 Trainline — transaction SEO at scale

- **Hero:** From/To + **“Save 46%…”** savings claim with asterisk + **Discover Europe** — immediate **E** + **C** (numbers).
- **Trust:** “270 companies”, “45 countries”, USD + Apple Pay / PayPal; **Born in 1997** brand story.
- **Cross-sell:** **Booking.com Genius** / stays strip — ecosystem **revenue** next to tickets.
- **Passes:** **Eurail** + **Japan rail** promo blocks — product expansion without leaving home.
- **FAQ:** Booking window, cancel/refund — reduces support and adds **D** (Komoot-class).
- **Footer:** **Komoot/Wanderboat-class** tail — popular journeys, carriers, stations, destinations, authors.
- **Takeaway:** gotrippin is **not** a ticket OTA; steal **FAQ depth** and **one** quantified proof line if true — not the full route matrix.

### 2.2 Omio — modality breadth as the headline

- **Position:** “trains, buses, flights & ferries” in one search — **modal agnostic** vs Trainline’s rail-first story.
- **Surface:** “Popular train, bus, flight and ferry connections” — **programmatic** city-pair URLs (`/trains/rome/naples`, `/ferries/...`).
- **App:** “Scan to get the Omio app” + refer-a-friend — **growth** loops on home.
- **Takeaway:** Useful reference for **multi-leg trip** positioning copy; our core is **one shared trip timeline**, not fare compare.

### 2.3 Eurail & Rail Europe — pass lane

- **Eurail:** Fetch was **thin** here — treat layout as **unknown** until a browser snapshot; likely pass-led **C** and **E** (pass SKUs).
- **Rail Europe:** **Timeout** — same **Round 8** rule: no inference.
- **Takeaway:** Pass products are **different JTBD** (open flexibility) vs gotrippin **fixed itinerary** — positioning clarity in FAQ if we ever mention rail.

### 2.4 Seat61 — information moat (not a planner)

- **Structure:** Multiple top-level **H1** blocks (UK, Europe, world) + huge **country link grid** — 2000s **authority** site that still wins long-tail.
- **Job:** **How to buy** / **which route** — education, not collaboration.
- **Takeaway:** Honest **guides** (when we publish) should aim for **Seat61 clarity**, not **Trainline** footer spam; different funnel stage.

### 2.5 Wanderlog — “PDFs” as a **Pro** vault, not an SEO page

- **Hero:** “One app for all your travel planning needs” + map/itinerary + **1M+** social proof wall.
- **Pro block:** **Unlimited attachments** — “Never dig through your emails again — access all your trip **files and PDFs** in one place.”
- **Also Pro:** Export to **Google Maps**, offline, Gmail scan — **E** is **bundle**, not a single PDF landing.
- **Takeaway:** Competitors bury **PDF** under **attachments / Pro**. Our **print/PDF export** (product) can stay **honest utility** on `/home` or docs — no need for a fake **“PDF itinerary SEO”** page unless we have unique content.

---

## 3. Rail × trip-planner adjacency

| Dimension | Trainline / Omio | Seat61 | gotrippin |
|-----------|------------------|--------|-----------|
| **Primary $** | Ticket / pass | Ads / goodwill | Trip OS (future attach) |
| **SEO shape** | City-pair + carriers | Country guides | Brand + intent (Phase 1 checklist) |
| **Collaboration** | Low | None | **High** |
| **Files / PDF** | Tickets | — | **Print view** / roadmap |

---

## 4. Rubric supplement (Round 9)

Same **A–F** scale as [Round 3](./marketing-frontend-rubric-round3-2026-04.md).

| Surface | A | B | C | D | E | F | **Avg** | Notes |
|---------|---|---|---|---|---|---|---|-------|
| **Trainline /** | 5 | 5 | 5 | 5 | 5 | 4 | **4.8** | FAQ + footer tail + passes; **F** busy |
| **Omio /** | 5 | 5 | 4 | 4 | 4 | 4 | **4.3** | Broad **C**; less hand-holding than Trainline FAQ |
| **Seat61 /** | 4 | 3 | 5 | 5 | 2 | 3 | **3.7** | **C/D** king; **E** not the job |
| **Wanderlog /** | 5 | 5 | 4 | 4 | 5 | 4 | **4.5** | Reviews + Pro grid; duplicate H2s in extract |
| **Eurail** (fetch) | — | — | — | — | — | — | **n/a** | Retry in-browser |

---

## 5. Idea buffet — ×12

1. **One** quantified proof line on `/home` if statistically clean (Trainline pattern).  
2. **FAQ** stub on marketing only when answers are **true** (refund, sharing, export).  
3. **Rail** copy: we’re **itinerary**, not **fares** — avoid OTA confusion in meta.  
4. **Attachments** story: align web copy with **gallery + print PDF** roadmap (Wanderlog Pro contrast).  
5. **Explore** city pages (Wanderlog) — only if UGC/guides are a real strategy.  
6. **Seat61-style** deep page **later** for one route we know well (e.g. “Plan a group van trip”) — optional.  
7. **Omio** reminder: ferries/buses = **leg types** in product vocabulary, not homepage clutter.  
8. **Cross-sell** (Booking strip): only with real partner or omit.  
9. **Japan / Eurail** promo cards: irrelevant unless we sell passes — skip.  
10. **Footer SEO** at Trainline scale — **years** of work; prefer **sitemap + few pillars**.  
11. **Rail Europe** / **Eurail** — retry in Round 10 or browser session.  
12. **Heading duplication** audit (Wanderlog extract) on our landing components.

---

## 6. Changelog

| Date | Note |
|------|------|
| 2026-04-03 | Round 9: Trainline, Omio, Seat61, Wanderlog (Pro PDFs), Eurail thin, Rail Europe timeout, rubric + adjacency map |
