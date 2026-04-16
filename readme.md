# gotrippin

**Plan together without the chaos.**

A route-first group trip planner — shared map, timeline, AI assistant, one link for everyone.

Live at [gotrippin.app](https://gotrippin.app)

---

## What it does

gotrippin helps small groups plan trips without juggling spreadsheets, screenshots and chaotic group chats.

- **Route-first planning** — the core of each trip is an ordered route (A → B → C). Locations drive activities, weather, images and collaboration.
- **AI assistant with tools** — a server-side AI agent that can call validated backend endpoints: create trips, manage locations, reorder routes, search cover images.
- **Shared trips** — join via invite link (authenticated); trip members can send **invite emails** through [Brevo](https://www.brevo.com) transactional API (`BREVO_*` in `apps/backend/.env`). Copy **join link** from the trip menu for a zero-email path.
- **Weather forecasts** — per-stop weather for trip dates via **[Open-Meteo](https://open-meteo.com/)** (forecast + geocoding HTTP APIs on the server; no vendor API key required for the public endpoints used in code).
- **Visual covers** — Unsplash integration with blurhash placeholders for instant loading.

---

## Architecture

Monorepo with three packages:

| Package | Stack | Role |
|---|---|---|
| `apps/web` | Next.js, React, Tailwind, Mapbox GL | Web client |
| `apps/backend` | NestJS, REST API | Business logic, AI orchestration, external APIs |
| `packages/core` | TypeScript, Zod | Shared types and validation schemas |

**Data layer:** Supabase (PostgreSQL + Auth + Storage + Realtime). Row-Level Security policies enforce per-trip access at the database level.

**Auth:** Supabase Auth (email/password + Google OAuth), JWT tokens, cookie-based sessions via `@supabase/ssr`.

---

## Tech Stack

**Frontend:** Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, Mapbox GL JS, i18next (BG/EN)

**Backend:** NestJS, Zod, Passport + JWT, Axios

**Infrastructure:** Supabase (PostgreSQL, Auth, Storage, Realtime), Vercel (frontend), Cloudflare R2 (image storage)

**Production builds:** both `apps/web` and `apps/backend` define an npm **`prebuild`** step that runs `npm run build:core` at the repo root so `@gotrippin/core` is compiled to `dist/` before `next build` / `nest build`. This avoids `Cannot find module '@gotrippin/core'` on hosts that only install workspace deps (e.g. Vercel, Render).

---

## Development

Prerequisites: Node.js 20+

```bash
npm install
npm run dev
```

- Web: http://localhost:3000
- API: http://localhost:3001

Environment files needed:
- `apps/web/.env.local` — Supabase keys, Mapbox token
- `apps/backend/.env` — Supabase service role key, API keys (Unsplash, OpenRouter, etc.); optional **Brevo** keys for trip invite email (`BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `PUBLIC_APP_URL`). See [`apps/backend/.env.example`](apps/backend/.env.example).

**Brevo:** verify the sender (or domain) in the Brevo dashboard before production; keep the API key **server-only** (never `NEXT_PUBLIC_*` on the web app).

---

## License

[MIT](LICENSE)
