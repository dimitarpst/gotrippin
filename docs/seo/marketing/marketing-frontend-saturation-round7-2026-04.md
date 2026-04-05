# Marketing frontend — saturation crawl (Round 7)

**Date:** 2026-04-03  
**Intent:** **Event / social coordination** as the sibling problem to trip planning (Partiful, Luma, Meetup), **Wanderboat** as **AI + OTA + SEO tail**, and another batch of **blocked / flaky** megasite fetches.

**Prior:** [Round 6](./marketing-frontend-saturation-round6-2026-04.md) · [Round 3 rubric](./marketing-frontend-rubric-round3-2026-04.md) · [Part I](./marketing-frontend-home-deep-dive-2026-04.md)

**Next:** [Round 8](./marketing-frontend-saturation-round8-2026-04.md) (megasite lighter URLs, Roamaround 503 watch)

---

## 1. Mega crawl log (this session)

| URL | Result | Bucket |
|-----|--------|--------|
| [partiful.com](https://partiful.com/) | OK | **Invites / RSVP / social** |
| [lu.ma](https://lu.ma/) | OK — ultra-short hero | **Events + tickets** |
| [meetup.com](https://www.meetup.com/) | OK — localized events feed | **Groups / outings** |
| [wanderboat.ai](https://wanderboat.ai/) | OK fetch — city/hotel grid + chat CTA | **AI discovery + booking** |
| [roamaround.com](https://www.roamaround.com/) | **503** | (Layla footer sibling — retry later) |
| [tripadvisor.com/Trips](https://www.tripadvisor.com/Trips) | **Timeout** | OTA / UGC |
| [expedia.com](https://www.expedia.com/) | **Timeout** | Mega OTA |
| [booking.com](https://www.booking.com/) | **Timeout** | Mega OTA |
| [egencia.com/en](https://www.egencia.com/en) | **403** | Corporate travel |

### Browser MCP (same session)

| Entry | Total refs | URL landed | Note |
|-------|------------|------------|------|
| **Partiful** | **152** | `https://partiful.com/` | Full marketing tree |
| **Wanderboat** | **21** | `https://wanderboat.ai/chat` | Root redirects to **app chat** — marketing is **not** this surface |

---

## 2. Deep dives

### 2.1 Partiful — proof density as personality

- **Hero:** “Fun, modern invites” + **100% free** + customization pillars (backgrounds, fonts, animations, posters).
- **Proof:** **Wirecutter / Atlantic / WSJ / WaPo / USA Today / NYT** quote links above the fold — maximum **C** without star ratings.
- **Social:** App Store **5.0 • 40K Ratings**, long **in-app review** wall (meme-level loyalty quotes).
- **SEO:** Footer **occasion** links (birthdays, dinners, housewarmings, Easter, …) — same **tail** strategy as Komoot/Wanderlog, different vertical.
- **Takeaway:** gotrippin could mirror **one** row of **real** press or **one** verifiable quote — not the whole party tone. **RSVP / guest list** psychology overlaps **group trip** (“who’s actually in”).

### 2.2 Luma — minimal delight

- Single H1 rhythm: **“Delightful events start here.”** + one paragraph + **Create** CTA.
- **Takeaway:** Radical **short** landing works when brand is known; unknown products usually need more **D** (gotrippin is not Luma-stage).

### 2.3 Meetup — “people platform” + travel lane

- **Position:** Interests → friendships; **free** membership; huge **event** lists (locale-dependent).
- **Category:** Explicit **[Travel and Outdoor](https://www.meetup.com/lp/outdoors-and-travel/)** LP — same humans who multi-day trip, different **job** (single events vs itinerary).
- **Fetch quirk:** Hero tagline repeated back-to-back in text extract — minor **copy/SEO** sloppiness to avoid.
- **Takeaway:** **Discovery** is Meetup’s wedge; gotrippin is **execution** on one shared plan — complementary, not competitor.

### 2.4 Wanderboat — two faces

1. **Fetched home / pillar content:** “Hello, what’s on your mind, Wander?” + **hotel search** (where/when/guests) + **massive** city/stay links + attractions/restaurants pillars — **Komoot-class** programmatic SEO + **OTA** hooks.
2. **Browser default:** Redirect to **`/chat`** — tiny a11y tree (**21** refs): chat input, **Create trip**, **Book stay**, **Map**, inspo buttons. **Product = chat shell**, not a long marketing page.
- **Takeaway:** Auditing “competitors” requires **both** fetch and **real URL** after redirects; judging Wanderboat on `/chat` alone misses the **SEO** story.

### 2.5 Mega OTAs & Egencia — access

- **Expedia / Booking.com / TripAdvisor** timeouts in this pass — use **browser** or **lighter** paths when needed; don’t infer product from failed fetch.
- **Egencia 403** — corporate sites often block automated fetch; same lesson as Round 6 **curator.com**.

---

## 3. Rubric supplement (Round 7)

Same **A–F** scale as [Round 3](./marketing-frontend-rubric-round3-2026-04.md). **Wanderboat** split on purpose.

| Surface | A | B | C | D | E | F | **Avg** | Notes |
|---------|---|---|---|---|---|---|---|-------|
| **Partiful** | 5 | 5 | 5 | 5 | 4 | 5 | **4.8** | Press quotes + reviews + feature grid; **E** light vs Layla FAQ |
| **Luma** (fetch) | 4 | 5 | 2 | 2 | 2 | 5 | **3.3** | Beautiful **F**; thin **C/D/E** on home |
| **Meetup** (fetch) | 5 | 5 | 4 | 4 | 3 | 4 | **4.2** | Live feed = **C**; duplicated hero text in extract |
| **Wanderboat `/chat`** | 3 | 4 | 2 | 2 | 2 | 4 | **2.8** | **App shell** — not fair as “marketing homepage” |
| **Wanderboat** (SEO fetch) | 5 | 5 | 4 | 5 | 3 | 4 | **4.3** | City/stay matrix + booking — **transaction** gravity |

---

## 4. Adjacency map (events ↔ trips)

| Job | Partiful / Luma | Meetup | gotrippin |
|-----|-----------------|--------|-----------|
| **One-off gathering** | Strong | Strong | Weak (on purpose) |
| **RSVP / who’s in** | Strong | Medium | Roadmap / partial |
| **Multi-day route + timeline** | Weak | Weak | **Core** |
| **Book transport/hotels** | Chip-in / links | Rare | Assistant + future |

Use this when positioning: **“Not your party invite — your trip spine.”**

---

## 5. Idea buffet — ×15

1. **One** press quote row with **outbound links** (Partiful pattern), only if real.  
2. **Occasion** footer SEO later (`/group-trip`, `/bachelor-weekend`) — don’t empty-link.  
3. **App Store** badge when native ships.  
4. **“Free”** clarity near CTA if forever-free tier exists.  
5. **Guest poll** for dates (Partiful “find a time”) — product, not marketing only.  
6. **Photo strip** post-trip — Pebbls + Partiful album idea; optional brand.  
7. **Blog** with **voice** (Partiful-style) only if you can sustain it.  
8. **Compare** Meetup outing vs gotrippin trip in one FAQ.  
9. **Redirect audit:** ensure `/home` doesn’t dump cold users into **login/chat** without story (Wanderboat lesson).  
10. **Sitemap** peek at competitor `site-map` URLs for **topic** ideas (Wanderboat exposes HTML sitemap).  
11. **404/503** retry list for Roamaround when stable.  
12. **Corporate** pages (Egencia) via browser-only notes — don’t scrape.  
13. **Heading duplication** check in gotrippin (Meetup caution).  
14. **Emoji** in H2/H3 — Partiful uses sparingly; match brand if at all.  
15. **“Wirecutter said…”** micro-copy vs full quote link — A/B trust.

---

## 6. Changelog

| Date | Note |
|------|------|
| 2026-04-03 | Round 7: Partiful, Luma, Meetup, Wanderboat dual surface, mega-OTA timeouts, Egencia 403, rubric supplement, adjacency map |
