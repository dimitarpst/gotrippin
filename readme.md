## Go Trippin'

Intelligent, route‑first trip planning with real‑time collaboration and an AI operator, built as a modern distributed web application.

Go Trippin' is the reference implementation for a full-stack TypeScript monorepo (Next.js + NestJS + Supabase + shared core package) and is used as a competition project for the Bulgarian National Olympiad in IT (direction “Distributed Applications”, XI–XII grade).

---

## Overview

Go Trippin' helps small groups plan trips together without juggling spreadsheets, screenshots and chaotic group chats.

- **Route‑first planning**: the core of each trip is an ordered route (A → B → C). Locations drive activities, weather, images and collaboration.
- **AI operator with tools**: a server‑side AI agent with session memory that can call whitelisted backend endpoints (create/update trips, manage locations, etc.).
- **Realtime collaboration**: multiple participants can work on the same trip simultaneously.
- **Production‑ready stack**: deployed frontend, backend and database with authentication, storage and Realtime sync.

Live deployment:

- Web app: https://gotrippin.app  
- API: https://api.gotrippin.app

---

## Key Features

- **Trip creation wizard**
  - Name, dates, visual theme and basic metadata.
  - Shareable 8‑character trip codes instead of long UUID URLs.

- **Route Builder**
  - Drag‑and‑drop route editing with dnd-kit.
  - Two‑phase reordering algorithm in the backend to keep order_index consistent under a UNIQUE(trip_id, order_index) constraint.

- **Activities and timeline**
  - Activities attached to specific locations (not just to the trip).
  - Timeline grouped by days and route stops.

- **Maps and places**
  - Route visualisation with Mapbox GL.
  - Integration with external services for points of interest and travel context.

- **Media and weather**
  - Unsplash image search with server‑side proxy and caching.
  - Weather forecasts per stop via Tomorrow.io.

- **AI Operator (server agent)**
  - Session memory (“slot store”) for current trip, dates and confirmed parameters.
  - Whitelisted tools mapping 1:1 to NestJS services (createTripDraft, updateTrip, addLocation, etc.).
  - All AI inputs validated through shared Zod schemas from the core package.

---

## Architecture

- **Monorepo (npm workspaces)**
  - `apps/web` – Next.js 16 (App Router, React Server Components + Client Components).
  - `apps/backend` – NestJS 10 REST API with modular DI architecture.
  - `packages/core` – shared TypeScript types and Zod schemas (`@gotrippin/core`).

- **Client–server model**
  - Frontend calls backend via REST (Axios/fetch) with Supabase JWT in the Authorization header.
  - Backend enforces business rules and validates data with shared schemas.

- **Data layer (Supabase / PostgreSQL)**
  - PostgreSQL with Row‑Level Security (RLS) for per‑user and per‑trip access.
  - Storage for images and assets.
  - Realtime subscriptions for trip locations and activities to keep clients in sync.

- **Route‑first data model**
  - `trips` – main trip metadata and membership (trip_members).
  - `trip_locations` – ordered route, constrained by UNIQUE(trip_id, order_index).
  - `activities` – activities linked to individual trip_locations.

For a more formal technical description (in Bulgarian) see `docs/Go Trippin Документация.md`.

---

## Tech Stack

- **Frontend**
  - Next.js 16, React 19
  - TypeScript (strict mode)
  - shadcn/ui + Radix UI
  - Framer Motion
  - Mapbox GL

- **Backend**
  - NestJS 10 (modular DI)
  - Axios HTTP client
  - Zod for schema validation (shared via @gotrippin/core)
  - Passport + passport-jwt for auth integration with Supabase Auth

- **Platform & Infra**
  - Supabase (PostgreSQL, Auth, Storage, Realtime)
  - Vercel (frontend)
  - Render (backend)
  - GitHub Actions (CI: lint, typecheck, build)

---

## Development Setup

Prerequisites:

- Node.js 20+
- npm (or pnpm/yarn, if you prefer; examples below use npm)

Install dependencies from the monorepo root:

```bash
npm install
```

Environment:

- `apps/web/.env.local` – Supabase keys, public Mapbox key, etc.
- `apps/backend/.env` – Supabase service role key, external API keys (Unsplash, Tomorrow.io), JWT config.

Start both apps in dev mode from the root:

```bash
npm run dev
```

This typically runs:

- Web (Next.js) on http://localhost:3000  
- Backend (NestJS) on http://localhost:3001

---

## Documentation

Key internal docs:

- `docs/Go Trippin Документация.md` – official Olympiad documentation (BG) with goals, architecture and implementation details.
- `docs/AI_TRIP_PLANNER.md` – AI operator and trip planning flow.
- `docs/route-based-trip-planning-architecture.md` – route‑first data model and reordering algorithm.
- `docs/SERVER_CLIENT_ARCHITECTURE.md` – server/client component responsibilities in the web app.
- `docs/MAPS_IMPLEMENTATION.md` – mapping, routing and POI strategy.

---

## Status and Roadmap (high level)

- ✅ Functional MVP (web + backend + database) deployed to production.
- ✅ Route‑first planning and collaborative editing.
- ✅ AI operator architecture defined and partially implemented.
- 🔜 Richer realtime presence (who is editing now), full mobile client (React Native), and deeper integrations with external travel services (“Trip Command Center”).

