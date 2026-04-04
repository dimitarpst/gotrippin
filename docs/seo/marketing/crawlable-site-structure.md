# What crawlers effectively see (gotrippin)

## Current shape (factual)

- **Marketing home:** `/home` (canonical marketing URL; `/` redirects per sitemap strategy).
- **App surface:** `/trips`, `/user`, `/ai`, etc. — typically **auth-gated** or low value for organic “sell the product” goals; not the main SEO story.
- **Legal / trust:** Footer links labeled **Privacy** and **Terms** in `CtaFooter.tsx` currently use **`href="#"`** — **no real routes** yet. For users and for trust signals, real `/privacy` and `/terms` pages are usually added before or alongside serious distribution.

- **External:** GitHub (or similar) as redirect — fine; not indexed as on-site content.

## Implication

Google does **not** need access to the dashboard to “understand” the product if:

1. **One strong public page** (or a small set: home, features, pricing, about, legal) explains **who it’s for**, **what it does**, and **how to start** — all in **crawlable HTML**.
2. **Structured data + titles/descriptions** match that story (`docs/seo/seo.todo` Phase 4).

Holding **GSC sitemap submit / indexing** until **IA + copy + trust pages** match intent is consistent with that strategy.

## Owner decisions (not automated)

- Which **additional public URLs** (e.g. `/features`, `/pricing`, `/about`) ship before pushing indexing hard.
- When **Privacy** / **Terms** go live and are linked from the same footer.

_Last updated: 2026-04-03_
