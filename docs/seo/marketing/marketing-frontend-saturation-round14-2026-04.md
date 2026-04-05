# Marketing frontend — saturation crawl (Round 14)

**Date:** 2026-04-03  
**Intent:** **Meta session** — queue **failed** URLs from this extended run, **cross-round themes** (Rounds 7–13), and **reliability** notes for future crawls. Light **fetch** attempts: [rome2rio.com](https://www.rome2rio.com/), [theculturetrip.com](https://theculturetrip.com/) → **timeout** (no product inference).

**Prior:** [Round 13](./marketing-frontend-saturation-round13-2026-04.md) · [Round 3](./marketing-frontend-rubric-round3-2026-04.md) · [Part I](./marketing-frontend-home-deep-dive-2026-04.md)

**Next:** Round 15 (TBD — **browser-only** batch: Rome2rio, Culture Trip, **Rail Europe**, **TripAdvisor**; or **Roamaround** when not **503**)

---

## 1. Mega crawl log (this session)

| URL | Result | Note |
|-----|--------|------|
| [rome2rio.com](https://www.rome2rio.com/) | **Timeout** | Multimodal routing — high value when captured |
| [theculturetrip.com](https://theculturetrip.com/) | **Timeout** | Editorial / destination SEO competitor |

---

## 2. Running queue — retry in browser

| Site | First seen | Status | Action |
|------|------------|--------|--------|
| **Roamaround** | Rounds 7–10 | **503** | Ping monthly; append short **addendum** doc when **200** |
| **TripAdvisor** | Rounds 7, 10 | **Timeout / 403** | Local Chrome; lighter `/` first |
| **Rail Europe** | Rounds 9, 11 | **Timeout** | Browser; try regional TLD |
| **Booking.com** | Round 7 | **Timeout** | Browser; home only |
| **Skyscanner** | Round 10 | **Thin** fetch | Full DOM snapshot |
| **Eurail** | Rounds 9, 11 | **Thin** title | Browser body |
| **Royal Caribbean** | Round 11 | **Vue leak** in extract | Visual / rendered H1 check |
| **Rome2rio** | Round 14 | **Timeout** | Browser |
| **Culture Trip** | Round 14 | **Timeout** | Browser |

---

## 3. Cross-round themes (7 → 14)

1. **Dual surfaces** — Wanderboat marketing vs `/chat` (R7); Komoot app vs web SEO (R13). **Audit redirects** so `/home` story stays primary.  
2. **Scale claims** — Viator 300k+, Komoot 50M+, Hostelworld 10M+ installs — **define** any similar gotrippin numbers.  
3. **UGC loops** — OnTheSnow reports, AllTrails, Meetup feed — **freshness** as **D**; only if sustainable.  
4. **Partnership depth** — REI×Intrepid, Intrepid×REI, Withlocals×Mastercard, Lonely Planet partners — **legal + FAQ** bar.  
5. **Private vs group** — Withlocals (private), G Adventures (small group), gotrippin (**shared plan**) — **wording** table in positioning docs.  
6. **Fetch variance** — Viator R11 fail / R12 OK — **timestamp** sessions in changelog.  
7. **B2B vs B2C** — Mapbox (R13) is **infra**; keep competitor matrix **B2C**-leaning.  
8. **Physical goods** — Polarsteps book (R10), Lonely Planet books (R12) — **merch** is separate funnel.  
9. **Climate / B Corp** — Hostelworld Climate Neutral, Intrepid/Withlocals B Corp — **certifications** only if earned.  
10. **Footer i18n** — Hostelworld language list — ties to **hreflang** Phase 5 in `seo.todo`.

---

## 4. Idea buffet — ×8

1. Add **`marketing-frontend-crawl-session.md`** template: date, tool, success/fail table — optional hygiene.  
2. **GSC** landing queries vs **these** competitor **headings** — quarterly spot-check.  
3. **Rome2rio** — when captured, compare to **Google Travel** (R6) for **leg-builder** UX copy.  
4. **Culture Trip** — **article** IA vs our **future** blog.  
5. **503 watch** automation — curl in CI **non-blocking** alert for **Roamaround** only if strategic.  
6. Compress rounds **7–14** into **`competitors-matrix.csv`** new column `round_cited` — optional data task.  
7. **Trip print PDF** — cross-link **Round 9** Wanderlog Pro + **Round 10** TripIt + product **print** route.  
8. **Round 15** — cap **browser** session at **5** sites to avoid fatigue.

---

## 5. Changelog

| Date | Note |
|------|------|
| 2026-04-03 | Round 14: Rome2rio + Culture Trip timeout; queue table; themes 7–14; prep Round 15 |
