# Go Trippin’ — Product & AI-Orchestrated Planning Plan

This file captures the evolving product direction and the “AI operator” concept. It is intentionally high-level so we can add/remove ideas without touching `readme.md`.

## Core Vision

- Travel planning that feels guided and collaborative: routes, activities, visuals, and invites in one place.
- Differentiator: an AI that not only suggests but **executes** actions via our own endpoints, while keeping conversation context.
- User-friendly over maximal feature lists; aim for guided choices, confirmations, and reversible steps.

## Signature Idea: AI Operator (Session Memory + Tools)

- Server-side agent with session-scoped state (conversation history summary + slot store).
- Whitelisted tools mapped to existing/backend endpoints (e.g., createTrip, addTripLocation, addActivity, fetchUnsplashOptions).
- Uses the user’s Supabase JWT so RLS/permissions apply; all tool inputs validated (Zod).
- Frontend: chat/wizard hybrid with quick replies/cards; shows “working” while tools run; confirmations before destructive actions.
- Memory strategy: keep a compact summary + slot state in DB (or Redis) and only the recent turns in the LLM context.

## Collaboration Angle (USP to refine)

- Roles: admin/planner/contributor/viewer (scoped actions: invite, edit route, add activities, view-only).
- Presence + realtime updates (Supabase Realtime) on routes/activities/timeline.
- Activity log/changelog (lightweight) for transparency.

## Features to Explore (not commitments)

- Route optimization with constraints (time/fuel/scenic); AI proposes, user confirms.
- Weather-aware adjustments (swap days if rain).
- Forward-to-trip email parsing (later: optional Gmail OAuth with strict scopes).
- Attachments linked to activities/locations with metadata extraction.
- “Personal template with AI”: generate a reusable skeleton from a prompt, then tweak.
- Guides/mini-collections as reusable checklists (avoid full CMS/blog).

## Trip Command Center (compact companion)

- A single hero view that surfaces the essentials per leg/day: leave-by time, top route, lodging address/check-in, PNR/refs, quick copy/open actions, weather nudge, and a tiny “changes since last visit” note.
- Framed as the “compact companion”: all critical info in one, clean, easy-to-access screen; avoid heavy real-time complexity—leverage existing data + light refreshes.
- Offline-friendly toggle to cache docs and a map snapshot; one-tap share with collaborators.
- Can be the default view for a read-only/viewer role; other roles can switch to full edit routes/activities.

## Chat Scopes (decision)

- Session types: `global` (no trip_id) and `trip` (has trip_id).
- Global sessions: owner-only (or future invitees), read-only planning tools; can create a new trip from the chat.
- Trip sessions: restricted to trip members via RLS; full tool access scoped to that trip.
- Conversion: a global session can be attached to a trip later (set trip_id, re-scope tools).
- UX: “Start chat” defaults to global; “AI for this trip” opens a trip-scoped chat; offer “attach this chat to trip X.”

## Phasing (rough)

1. Define roles/permissions + RLS alignment; UX states for each role.
2. AI trip creator v0: gather slots (destination, dates, title, image), call tools, build a real trip; chat + cards UI.
3. Route builder + activity-location linking + timeline; wire Realtime.
4. Route optimization (MVP via directions API) and weather-aware suggestions.
5. Ingestion: forward-to-trip parsing; later Gmail OAuth if needed.
6. Safety/budget guardrails (warn on long legs, tight layovers, budget overages).
7. AI enhancements: propose POIs/segments; “apply” buttons to commit changes.

## Open Questions

- LLM/model choice: candidates GPT‑5‑mini (cost-effective generalist) and Gemini (1.5/2) for planning tasks; keep context moderate and rely on summaries + slot state.
- Session state storage/retention: decide DB vs cache combo and expiry policy (to discuss next).
- Multi-user AI chat: one active turn lock per trip; Realtime presence/typing; others queue while viewing is allowed.
- Routing optimization API: on hold until map phase; likely Google or Mapbox Directions.

## Principles

- Keep AI actions reversible and confirmed by the user.
- Prefer small, composable tools over one big “do everything” call.
- Stay UI-first: always give clear options and progress feedback.
- Protect privacy: least-privilege scopes, no broad email access by default.
