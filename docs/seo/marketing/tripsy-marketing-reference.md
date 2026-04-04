# Tripsy — marketing & IA reference (study notes)

**Purpose:** Document **structure, rhythm, information architecture, and visual patterns** from [Tripsy](https://tripsy.app/) as inspiration for gotrippin’s public site. This is **not** a license to reuse copy, screenshots, or branding; differentiate voice, visuals, and claims. Same category as [Arturia page anatomy](./arturia-page-structure-reference.md): **patterns**, not clones.

**Sources:**

- Live: [tripsy.app](https://tripsy.app/), [tripsy.app/pro](https://tripsy.app/pro), [tripsy.app/recap](https://tripsy.app/recap), [tripsy.app/updates](https://tripsy.app/updates)  
- **Full-page captures** (stakeholder, 2026-04-03): studied below — see [Screenshot inventory](#screenshot-inventory).

---

## Visual & UI system (from captures)

### Marketing home (`/`)

- **Canvas:** Near-white background, **heavy vertical spacing** between bands — scan-friendly, “Apple-adjacent” calm.  
- **Typography:** Bold black **display** headlines; body / subheads in **muted grey**; **tight letterspacing** on big type.  
- **Accent:** **Orange** used as a **section label** (small caps / eyebrow above H2) — not flooding the page; keeps rhythm: *label (orange) → headline (black) → grey body*.  
- **Secondary color:** Category **roundels** (plane, bed, car, food, etc.) in **blue / purple / red / yellow** — breaks monochrome and signals “many trip types.”  
- **Proof pattern:** **Device mockup first-class** — large iPhone, real UI (Rome / Paris trip); **floating satellite cards** (flight delay, map snippet) for depth — reads as *product*, not stock travel.  
- **Social proof row:** App Store badge, editorial badge (“App of the Day”), **star rating + review count** — sits **between** hero copy and mockup (or just below headline depending on breakpoint).  
- **Mid-page collaboration:** **Two white cards** side by side (e.g. view-only vs can-edit) + optional **full-width peach / light-orange band** for community or “everyone aligned” message — strong **permission education** pattern.  
- **Closing:** **Solid black band** — white headline (*Your next trip starts here*), short subline, **high-contrast white button** (Get started / Download). Hard stop before footer.  
- **Footer:** Multi-column links on **light** background after the black CTA (captures vary slightly).

### Pro / pricing (`/pro`)

- **Canvas:** **Dark mode** — deep black background, white type, **orange** for PRO wordmark and highlights.  
- **Hero:** **Large app icon** centered above **H1** (*Tripsy* white + *PRO* orange); **subtitle** centered (*The Ultimate Trip Companion*).  
- **Pricing:** **Two equal cards** (rounded, dark grey), side by side — tier name (orange), **big price**, short terms, **“Shareable with Family”** with simple icons, **white Buy Now** buttons (black text).  
- **Comparison table:** Header row **All you can do | Free | PRO** with **PRO** in **orange pill/tag**; rows are **thin dividers**; **orange check** = included, **empty circle** = not — scannable, no noisy grid.  
- **Footer:** Same column model as marketing site; social icons bottom bar.

### gotrippin design takeaways (not Tripsy colors per se)

| Tripsy pattern | Use for gotrippin |
|----------------|-------------------|
| Eyebrow + H2 + body | Reuse **rhythm**; keep **coral** as our primary, not orange |
| Phone + real UI + floaters | Replace fake Kyoto card with **real map/route UI** or abstract wireframe |
| Social proof | Add when we have **real** App Store / quotes / press — no fake badges |
| Permission cards | Perfect template when **sharing** ships; honest labels |
| Black final CTA band | Strong **bookend**; can adapt to brand dark / coral |
| Dark pricing page | Optional later for `/pricing`; high contrast tier cards |

---

## Homepage IA — detailed (aligned with captures)

**Nav (note:** captures differ slightly — e.g. Features vs Pro / Recap / Updates; treat as **same IA**, label tests or locales.)

1. **Sticky header** — Logo left; **center links**; **primary CTA right** (black pill: Get started / Download / Get the app).  
2. **Hero** — Two-line headline; grey value prop; **badges + rating**; **center iPhone** + floating UI.  
3. **You book it. Tripsy builds it.** — Email automation story + mockup + **orbiting category icons** (visual metaphor for ingestion).  
4. **All trip activities in one place** — **Icon row** then copy (consolidation).  
5. **Flight changes** — Centered text block.  
6. **Plan better / Calendar** — Orange eyebrow + headline (sometimes inline color on keyword).  
7. **Share your trip** — Headline + **Set permissions**; **two cards**; optional **community / alignment** band.  
8. **Expenses** — Short centered block.  
9. **Everything you need** — Documents, notes, photos narrative.  
10. **Tripsy Book** — Orange label + emotional recap headline.  
11. **TripIt / TripCase alternative** — SEO + switcher paragraph.  
12. **Black CTA band** + **footer**.

### What to steal (adapted)

- **Permission storytelling** before over-promising share.  
- **One enemy:** scattered tools — maps to our **chaos** line.  
- **Bookend CTA** (hero soft → footer hard).  
- **Comparison block** only when we have a real story.

---

## Pro page — detailed (aligned with captures)

1. Header: logo, nav, **Get the app** (white pill on dark).  
2. Icon + **Tripsy PRO** + subtitle.  
3. **Two pricing cards** (Lifetime / One year) — family sharing, Stripe CTAs.  
4. **Feature matrix** Free vs Pro with visual check / empty states.  
5. Footer columns.

### gotrippin takeaway

Dedicated **`/pricing`** when tiers exist; table only when boundaries are **stable and honest**.

---

## Page: [tripsy.app/recap](https://tripsy.app/recap) (feature landing)

- H1 emotional promise → what is it → bullets → where it lives → CTA.  
- **gotrippin:** one major feature = one URL when we ship something similar.

---

## Page: [tripsy.app/updates](https://tripsy.app/updates) (changelog)

- Version headings, grouped bullets, long scroll = **shipping trust**.  
- **gotrippin:** `/updates` or `/changelog` when we want the same signal.

---

## Support

Tripsy: Help, Contact, Service Status. We can start with **mailto / GitHub / light `/support`** until volume needs more.

---

## Differentiation checklist

- **Map + route** as center of gravity when true.  
- **AI** only as shipped.  
- **Web-first** (they optimize for app download).  
- **Collaboration:** honest roadmap language if not live.

---

## Screenshot inventory

Full-page references you provided (filenames from Cursor workspace storage). **Copy into** `docs/seo/marketing/assets/tripsy/` **if you want them versioned in git** (paths below are outside `gotrippin` by default).

| File (Cursor assets) | Page | Notes |
|----------------------|------|--------|
| `image-5f2a7f65-8351-47c2-a185-65d8d3f9b0ba.png` | **Pro / pricing** | Dark theme, dual cards, Free vs PRO table, footer |
| `image-001c00c9-0112-4f54-829d-525b6bb84c28.png` | **Home** | Light, Features nav variant, Rome mockup, social proof |
| `image-487d8e76-5208-4ed1-a905-17646c58c2c5.png` | **Home** | Long scroll, Pro/Recap/Updates nav, Paris mockup, icon row |

- [x] Home — hero + first fold (captures 2–3)  
- [x] Home — sharing / permissions (capture 3)  
- [x] Pro — pricing + table (capture 1)  
- [ ] Recap — layout *(add when captured)*  
- [ ] Updates — version block *(add when captured)*  

---

_Last updated: 2026-04-03 (visual pass from full-page screenshots)._
