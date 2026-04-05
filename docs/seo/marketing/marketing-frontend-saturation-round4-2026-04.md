# Marketing frontend — saturation crawl (Round 4: “MORE”)

**Date:** 2026-04-05  
**Intent:** Expand the **corpus** beyond Rounds 1–3: **pricing**, **B2B**, **vertical** (outdoor, OTA-style), **long-copy vintage**, and **anti-patterns**. Use for **pattern matching**, not endorsement.

**Prior rounds:** [Part I](./marketing-frontend-home-deep-dive-2026-04.md) · [Round 2](./marketing-frontend-crawl-round2-2026-04.md) · [Round 3 rubric](./marketing-frontend-rubric-round3-2026-04.md)

**Next:** [Round 5 saturation](./marketing-frontend-saturation-round5-2026-04.md) · [Round 4 rubric + DOM](./marketing-frontend-rubric-round4-2026-04.md)

---

## 1. Mega crawl log (this session)

| URL | Result | Bucket |
|-----|--------|--------|
| [planapple.com](https://www.planapple.com/) | OK — long narrative, video CTA, demo trip | Consumer / vintage web |
| [wanderlog.com/pro](https://wanderlog.com/pro) | Minimal text (animated logo fetch) | Pricing / upgrade (**thin in text crawl**) |
| [lonelyplanet.com/planning](https://www.lonelyplanet.com/planning) | **404** | — |
| [travefy.com](https://travefy.com/) | OK — **B2B agent** home | Travel advisor SaaS |
| [travefy.com/personal-group-travel-planner](https://travefy.com/personal-group-travel-planner) | Same as home (likely **duplicate template**) | SEO URL |
| [komoot.com](https://komoot.com/) | OK — **massive** guides + collections | Outdoor / route / SEO empire |
| [triplanly.com](https://www.triplanly.com/) | OK — steps + AI soon + **1000+ groups** | Group collab |
| [getyourguide.com](https://www.getyourguide.com/) | OK — search + cities + reviews | **Transaction** marketplace |
| [airbnb.com/s/experiences](https://www.airbnb.com/s/experiences) | Placeholder / empty in fetch | Crawl-hostile (note only) |

*Plus earlier rounds:* TripIt free, Awaii, Linear, Plan Harmony, Wanderlog, Roadtrippers, Pilot, GatherTrip, Vercel, Notion, Tripnotes→Dorsia, etc.

---

## 2. Deep dives (new angles)

### 2.1 Planapple — “travel binder” long-copy era

- **Voice:** Conversational, **paragraph-heavy**, almost blog-like on the homepage (`Organize Ideas`, `Plan Together`, `Carry Your Plans`, `Share With Friends`).
- **Proof mechanic:** **Sample trip** link + **short video** CTA — old-school but **trust-building**.
- **Takeaway:** Long copy still works when **tone** is warm and **specific** (inbox clutter, tripmates). gotrippin could use **one** long section as `/why` or expanded `#story` without becoming 2008 clutter.

### 2.2 Travefy — B2B scale + **critical anti-pattern**

- **ICP:** Agents, agencies, DMCs, tour operators — **not** the same buyer as gotrippin’s leisure crew, but **itinerary builder** positioning overlaps in **language**.
- **Good:** Clear product grid (itinerary, CRM, proposal, website, app), **segmented** solutions, **named testimonials**, FAQ, newsletter, **pricing** programs ($25 NTAP mentioned).
- **BAD (live as of fetch):** Repeated placeholder strings: *“This is a bold value point . And then this is where supporting text will go.”* under multiple **“Power your brand” / “Reduce costs”** headings — **shipping unfinished blocks** on a **production** marketing site.
- **Takeaway:** **Internal QA checklist:** search staging copy on prod; **never** ship placeholder headings. Worse than no section.

### 2.3 Komoot — route + **SEO as the product**

- **Hero job:** Find / plan / share **adventures**; sport-specific (hike, MTB, road).
- **Structure:** Repeating **Signup / Get the App** pairs; **Collections** (curated routes); **huge** location link matrix (countries, parks, trails).
- **Proof:** **50M+** explorers, **8M+** routes, **850M+** community photos — **numeric gravity**.
- **Takeaway:** gotrippin will **not** replicate Komoot’s index; lesson is **one clear stat** + **one** curated list (e.g. “Example trip shapes”) beats vague “we’re great.”

### 2.4 GetYourGuide — **transaction-first** “planner”

- **Not a planner** in the gotrippin sense — **inventory + search + social proof** (verified reviews, stars).
- **Takeaway:** If gotrippin ever adds **bookable** tiles, this is the **UX gravity** users expect; until then, **don’t** look like a hollow OTA.

### 2.5 Triplanly (refresh)

- **Social proof:** “**1000+ groups** already planned” — **specific number** in hero territory.
- **Structure:** 3 steps; **AI coming soon** section (honest or vapor — depends on ship).
- **Takeaway:** Small **numeric** claims **above** fold are cheap **C** rubric wins if **true**.

### 2.6 Wanderlog `/pro` (fetch note)

- Text crawl returned almost nothing useful — likely **client-rendered** or **blocked**. **Lesson:** audit **pricing** URLs in **real browser** (Round 3 method), not fetch-only.

---

## 3. Pattern matrix (expanded)

| Pattern | Example (Round 4) | Use for gotrippin? |
|---------|-------------------|---------------------|
| **Vintage longcopy** | Planapple | Optional deep `/why` |
| **B2B agent suite** | Travefy | Positioning reference only; different buyer |
| **SEO continent** | Komoot, Wanderlog tail | Selective blog/guides later |
| **Marketplace + reviews** | GetYourGuide | Only if product truly transactional |
| **Numeric social proof** | Komoot, Triplanly | Yes if **verifiable** |
| **Placeholder sections on prod** | Travefy | **Forbidden** |

---

## 4. Idea buffet — experiments (no filter)

Use with [`market-strategy-idea-origin-deep-dive-2026-04.md`](./market-strategy-idea-origin-deep-dive-2026-04.md) — **don’t** do all; pick **one** at a time.

1. **“Chat vs gotrippin”** two-column (Awaii pattern).  
2. **One public number**: trips created, stops planned, or GitHub stars.  
3. **Demo trip** read-only share link (Planapple “sample trip”).  
4. **90-second Loom** embedded once (no autoplay).  
5. **/why** long-read: chaos thesis only.  
6. **Changelog** strip on `/home` (Linear).  
7. **Wall of tweets** (manual embeds) instead of fake reviews.  
8. **Comparison** mini-page: gotrippin vs Sheets vs WhatsApp (honest).  
9. **Route “recipe”** cards: road trip, multi-city Euro, weekend ski.  
10. **Dark + light** hero screenshot pair.  
11. **Customer voice** quotes — only with permission.  
12. **Press kit** zip (logo, colors, one paragraph).  
13. **OG image** with **route line** only (no fake UI).  
14. **Email course**: “5 emails to plan a crew trip.”  
15. **Reddit AMA** transcript excerpt on site.  
16. **Sticker** / **merch** joke section (brand play).  
17. **“Built in public”** revenue or user graph (if comfortable).  
18. **Interactive** “drag 3 cities” toy (Roadtrippers-lite).  
19. **BG-first** landing variant path (hreflang later).  
20. **Accessibility** brag (WCAG goals) for EU users.  
21. **Print** marketing: “Your trip fits on two pages.”  
22. **Map style** preview: Mapbox vs Google note (transparency).  
23. **AI disclaimer** block (what it does / doesn’t).  
24. **Guest roadmap** timeline graphic.  
25. **Partner** with one travel blogger (single case study).  
26. **Nominate** “messiest group chat” contest (risky fun).  
27. **Seasonal** skin: summer vs winter hero gradient.  
28. **Sound off** (optional): subtle ambient toggle — **probably skip**.  
29. **Keyboard** shortcut hint on marketing (`?` modal) — dev brand.  
30. **404** page with **trip pun** + CTA to `/home`.  
31. **`/open`** page listing stack (Next, Nest, Supabase).  
32. **Security** page: how trips are shared (RLS story simplified).  
33. **Export** promise callout: PDF / print already in app → mention.  
34. **Timeline** animation CSS-only (no Lottie dependency).  
35. **Bento** fourth tile: “Print & PDF.”  
36. **Footer** random **trip emoji** of the day (silly retention).  
37. **H1 A/B**: “without the chaos” vs “one route everyone sees.”  
38. **Micro-FAQ** in footer accordion.  
39. **Jobs** page even if not hiring (“future roles”).  
40. **Public roadmap** Trello/GitHub Projects embed.

---

## 5. Anti-pattern hall of fame

| Sin | Example | Fix |
|-----|---------|-----|
| **Placeholder copy live** | Travefy “bold value point” blocks | CI grep for “lorem”, “placeholder”, “supporting text will go” |
| **Duplicate URL same body** | Travefy personal-group URL = home | Canonical or unique copy |
| **Acquisition zombie** | Tripnotes → Dorsia | Own your domain story |
| **Crawl empty luxury** | Airbnb experiences in fetch | Don’t judge SPA by fetch alone |

---

## 6. Changelog

| Date | Note |
|------|------|
| 2026-04-05 | Round 4: Planapple, Travefy (+ anti-pattern), Komoot, Triplanly, GYG, Airbnb note, Wanderlog Pro note, idea buffet ×40 |
| 2026-04-03 | Cross-links: Round 5 saturation + Round 4 rubric (DOM/scores) |
