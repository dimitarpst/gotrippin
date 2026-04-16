# Marketing screenshots (`/home` hero)

Replace the placeholder **SVG wireframes** with compressed **WebP** (or PNG) exports from the real gotrippin web app when ready:

| File | Suggested capture |
|------|-------------------|
| `hero-map.webp` | Trip route map with stops visible (same trip as timeline). |
| `hero-timeline.webp` | Trip timeline or overview list for that trip. |

After adding valid raster files, the marketing map band uses `public/landing/hero-map.webp` in `apps/web/src/components/landing/LandingMarketingSections.tsx` (`next/image`).

Current shipped files (`hero-map.svg`, `hero-timeline.svg`) are **generic UI wireframes**, not real product screenshots.
