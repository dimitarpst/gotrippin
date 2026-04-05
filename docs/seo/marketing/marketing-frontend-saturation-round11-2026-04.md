# Marketing frontend — saturation crawl (Round 11)

**Date:** 2026-04-03  
**Intent:** **Packaged travel** lane — **cruise** megabrands (Royal Caribbean, NCL), **small-group adventure** operators (G Adventures, Intrepid), and **activities marketplace** (GetYourGuide; Viator timeout). Compares to gotrippin’s **DIY + shared plan** positioning.

**Prior:** [Round 10](./marketing-frontend-saturation-round10-2026-04.md) · [Round 3 rubric](./marketing-frontend-rubric-round3-2026-04.md) · [Part I](./marketing-frontend-home-deep-dive-2026-04.md)

**Next:** [Round 12](./marketing-frontend-saturation-round12-2026-04.md) (Hostelworld, Viator OK, OnTheSnow, REI×Intrepid, Lonely Planet Journeys)

---

## 1. Mega crawl log (this session)

| URL | Result | Bucket |
|-----|--------|--------|
| [royalcaribbean.com](https://www.royalcaribbean.com/) | **OK** — deal stack + ship SKUs; **Vue/template** fragments in text extract | **Cruise** OTA |
| [ncl.com](https://www.ncl.com/) (redirected to **uk/en** in pass) | **OK** — long emotional **hero** + **Free at Sea™** + destinations | **Cruise** |
| [gadventures.com](https://www.gadventures.com/) | **OK** — six “why us” pillars + **since 1990** | **Adventure** tour |
| [intrepidtravel.com](https://www.intrepidtravel.com/) (US) | **OK** — sale bands + **trip cards** + B Corp + **The Good Times** blog | **Adventure** tour |
| [getyourguide.com](https://www.getyourguide.com/) | **OK** — city + attraction hubs + **verified** reviews + **Originals** | **Activities** marketplace |
| [viator.com](https://www.viator.com/) | **Timeout** | Activities marketplace |

---

## 2. Deep dives

### 2.1 Royal Caribbean — promo density + SPA leakage

- **Above fold:** Stacked **$ off** + **3rd & 4th guests free** + **bonus** — pure **E**.
- **Merch:** Ship-specific tiles (e.g. **Quantum of the Seas**), **STARTING FROM [price]** pattern repeated.
- **Tech note:** Text extract includes **`{{ }}` / `:globalization`** fragments — **not** what crawlers should trust; real **canonical** and visible offers matter for SEO, but automated copy audits **understate** polish.
- **Takeaway:** gotrippin should never match **cruise promo** cadence; if we run **seasonal** offers, **one** clear line beats a **ladder** of asterisks.

### 2.2 Norwegian (NCL) — narrative + package brand

- **Tone:** Long **“Great Life”** / private-island storytelling — **D** through **emotion**, not specs.
- **Product:** **Free at Sea™** as **bundle** anchor (drinks, Wi‑Fi, dining, excursions) — **E** as **value stack**.
- **SEO:** **Top destinations** list (Caribbean, Alaska, Europe, …) — destination **tail** like OTAs.
- **Compliance:** **ATOL** disclosure block (UK) — **F** trust for regulated markets.
- **Takeaway:** Useful for **destination** footer strategy **only** if we have **real** place content; **bundle naming** (Free at Sea) is **brand IP** — invent our own honest bundles if ever needed.

### 2.3 G Adventures — disciplined differentiation

- **H1:** “Small group adventures that bring the world closer” — **clear ICP**.
- **Proof:** **Since 1990**, **every continent**, **community tourism** — **C** without star spam on this pass.
- **Mechanism:** **CEOs** (guides), small groups, **“ungrouped”** freedom, impact — **six** tight reasons (scannable **D**).
- **Takeaway:** Good **template** for a **“Why gotrippin”** section: **one** line each, no fluff adjectives.

### 2.4 Intrepid — merchandising machine + purpose

- **Surface:** **Short Breaks sale**, **New trips**, **REI collab** bands — **multiple** H1-level promos (watch **heading hierarchy** on our site).
- **Cards:** Trip tiles with **micro-headlines** (“Monday blues Croatia style”) — **personality** + **price** + **duration** — **C** + **E**.
- **Trust:** **B Corp**, **Intrepid Foundation**, **flexible bookings**, **pay later** — **F** + **E**.
- **Content:** **The Good Times** blog — **editorial** SEO.
- **Takeaway:** **Trip-card** rhythm is relevant if we ever show **sample trips** or **templates**; **collab** band (REI) is **partnership** playbook, not solo SaaS.

### 2.5 GetYourGuide — two-sided marketplace SEO

- **Hero:** “Discover & book things to do” + **search** (place / time / travelers).
- **Structure:** **City** LPs (Rome, Paris, …), **attraction** hubs (Vatican, Eiffel, …) with **activity counts** — classic **programmatic** tail.
- **Social proof:** **Verified booking** reviews on home — **C** with **fresh dates** in extract.
- **Product lines:** **Originals by GetYourGuide** — owned supply vertical.
- **Takeaway:** **Activities** are **adjacent** to gotrippin **stops**; we are **not** a marketplace — avoid **count** claims we can’t back (e.g. “X tours”).

### 2.6 Viator — timeout

- Same treatment as other megasites: **browser-only** retry; no inference.

---

## 3. Packaged vs planner — positioning guardrails

| Dimension | Cruise / tour / GYG | gotrippin |
|-----------|---------------------|-----------|
| **SKU** | Fixed itinerary product | **User-built** trip |
| **Money** | Ticket / deposit / bundle | Free core + future attach |
| **SEO** | Destination × product | **Intent** (“plan trip”, “group itinerary”) |
| **Trust** | ATOL, B Corp, reviews | Honest roadmap, real screenshots |

**One-liner:** They sell **completed trips**; we sell **shared planning spine** (then users book wherever).

---

## 4. Rubric supplement (Round 11)

Same **A–F** scale as [Round 3](./marketing-frontend-rubric-round3-2026-04.md). **Royal** scored on **visible** marketing intent, not broken extract artifacts.

| Surface | A | B | C | D | E | F | **Avg** | Notes |
|---------|---|---|---|---|---|---|---|-------|
| **Royal Caribbean /** | 4 | 4 | 4 | 3 | 5 | 3 | **3.8** | Promo **E** max; **D** thin; extract noisy |
| **NCL /** (uk/en) | 5 | 5 | 4 | 5 | 5 | 4 | **4.7** | Story + **F** compliance |
| **G Adventures /** | 5 | 5 | 4 | 5 | 3 | 5 | **4.5** | Clean **six pillars** |
| **Intrepid /** | 5 | 5 | 5 | 4 | 5 | 5 | **4.8** | Cards + blog + purpose |
| **GetYourGuide /** | 5 | 5 | 5 | 4 | 5 | 4 | **4.7** | Marketplace **C** depth |

---

## 5. Idea buffet — ×12

1. **“Why us”** row: **six** bullets max (G Adventures pattern).  
2. **One** seasonal offer strip — not Royal’s **stack**.  
3. **Compliance** footer block when EU/UK legal needs it (NCL ATOL lesson).  
4. **B Corp / impact** only if certified or **honest** pre-cert narrative.  
5. **Partner** band (Intrepid × REI) — only with **signed** partners.  
6. **Trip cards** on marketing: **real** user trips or **clear** fictional examples.  
7. **Attraction** SEO — skip until **place** product depth exists.  
8. **Verified**-style reviews — only **real** app store / testimonial quotes.  
9. **Blog** (“Good Times”) — commit cadence or don’t launch.  
10. **Locale** redirect (NCL **uk/en**) — document gotrippin **single URL** strategy in `seo.todo`.  
11. **SPA** marketing: validate **H1** in **rendered** DOM, not fetch text.  
12. **Viator** — add to Round 12 **browser** queue with TripAdvisor.

---

## 6. Changelog

| Date | Note |
|------|------|
| 2026-04-03 | Round 11: Royal, NCL, G Adventures, Intrepid, GetYourGuide, Viator timeout; packaged vs planner map; rubric |
