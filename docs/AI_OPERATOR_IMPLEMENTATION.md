## AI Operator Implementation (glm‑5 via OpenRouter)

**Status:** Planned (see `features.todo` “AI operator” item)  
**Related docs:** `docs/AI_TRIP_PLANNER.md`, `docs/plan.md`, `docs/route-based-trip-planning-architecture.md`, `readme.md`

This document specifies how to implement the AI operator for Go Trippin’ on top of the existing NestJS backend, Supabase schema, and route‑first trip model, using **glm‑5 via OpenRouter** as the default LLM engine.

The goal is to keep the agent:

- **Tool‑driven** — all mutations go through existing NestJS services (trips, locations, activities, images, weather).
- **Session‑scoped** — global vs trip sessions, with server‑side memory (summary + slot store).
- **Model‑agnostic** — glm‑5 is the default, but the design allows swapping models without rewriting the agent.

---

### 1. Data Model (Session + Optional Message Log)

#### 1.1 `ai_sessions` (required)

New table in Supabase (PostgreSQL):

- `id UUID PK DEFAULT gen_random_uuid()`
- `user_id UUID NOT NULL` — references `auth.users.id` (via Supabase).
- `trip_id UUID NULL` — optional; if set, session is trip‑scoped.
- `scope TEXT NOT NULL` — `'global' | 'trip'`.
- `summary TEXT` — compact natural‑language summary of the conversation so far.
- `slots JSONB` — structured memory / slot store (destination, dates, current trip_id, preferences, etc.).
- `model_name TEXT NOT NULL DEFAULT 'glm-5'` — e.g. `"glm-5"`, `"gpt-4.1-mini"`, etc.
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

**RLS policies:**

- **Select/Update/Delete:** allowed only when:
  - `user_id = auth.uid()`, and
  - if `trip_id` is not null, the user is also a member of that trip (reuse existing `trip_members` logic).

This ensures the AI operator can only access sessions owned by the current user and scoped to trips they can see.

#### 1.2 `ai_messages` (optional but recommended for debugging)

If we want a persistent log (beyond in‑memory or short‑term cache), add:

- `id UUID PK DEFAULT gen_random_uuid()`
- `session_id UUID NOT NULL REFERENCES ai_sessions(id) ON DELETE CASCADE`
- `role TEXT NOT NULL` — `'user' | 'assistant' | 'tool' | 'system'`
- `content JSONB NOT NULL` — OpenAI‑style message structure (including `tool_calls` and arguments).
- `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`

**RLS:** mirror `ai_sessions` (joined on `session_id` → `user_id`), so only the session owner can read its messages.

For v1, the agent can store only the last N messages in the DB or even skip this table; `ai_sessions.summary` + `slots` is the critical part.

---

### 2. NestJS AI Module (Phase 1 + 2)

Create a dedicated module under `apps/backend/src/ai/`:

- `ai.module.ts`
- `ai.controller.ts`
- `ai.service.ts`
- `dto/create-session.dto.ts`
- `dto/post-message.dto.ts`

#### 2.1 API surface (HTTP)

All endpoints are authenticated via the existing JWT guard.

- `POST /ai/sessions`
  - Body:
    - `scope: 'global' | 'trip'`
    - `trip_id?: string` (required when `scope === 'trip'`)
    - Optional `initial_message?: string` (to support “one‑shot” prompts).
  - Behavior:
    - Validates `trip_id` membership using existing trips / trip_members services.
    - Creates `ai_sessions` row with empty `summary` + `slots = {}`.
    - Optionally triggers a **welcome message** via `ai.service` (call model once with a system prompt and initial instructions).
  - Returns: `session_id` and initial assistant message (if any).

- `POST /ai/sessions/:sessionId/messages`
  - Body:
    - `message: string`
  - Behavior:
    1. Loads `ai_sessions` row (checks ownership + trip membership).
    2. Loads **recent messages** if `ai_messages` is used.
    3. Builds model input (system + summary + recent turns + current user message + tool schema).
    4. Calls the LLM via `OpenRouterClient` with tools enabled.
    5. If the model returns tool calls:
       - Validates arguments with shared Zod schemas.
       - Executes corresponding NestJS services.
       - Feeds results back into a **follow‑up model call** as `tool` messages.
       - Repeats until the model returns a normal `assistant` message or a max tool‑call depth is reached.
    6. Updates `ai_sessions.summary` and `slots` (either via a dedicated summarization call or by having the model respond with updated state).
    7. Optionally appends all messages to `ai_messages`.
  - Returns: final assistant message, plus optional structured metadata (which tools were called, warnings, etc.).

In v1, this endpoint can be **non‑streaming**. Streaming can be added later for a better UX.

---

### 3. OpenRouter + glm‑5 Integration (Phase 1)

Create a reusable client, e.g. `apps/backend/src/ai/openrouter.client.ts`:

- Reads env vars:
  - `OPENROUTER_API_KEY`
  - `OPENROUTER_BASE_URL` (default `https://openrouter.ai/api/v1`)
- Exposes a single method:

```ts
interface LlmTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON Schema
}

interface LlmMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  // optional tool_call metadata
}

interface CallModelOptions {
  model: string; // e.g. 'glm-5'
  messages: LlmMessage[];
  tools?: LlmTool[];
  tool_choice?: 'auto' | { type: 'function'; function: { name: string } };
}
```

- The client sends an OpenAI‑compatible JSON payload to OpenRouter:
  - `model: 'glm-5'`
  - `messages: [...]`
  - `tools: [...]` (OpenRouter expects OpenAI tool/“function calling” format)
- Handles HTTP errors and timeouts; wraps them in a typed error for `AiService` to handle.

**Design goal:** The AI module only ever depends on `LlmClient` interface; the concrete implementation (`OpenRouterClient` with glm‑5) can be swapped by configuration.

---

### 4. Tool Catalog (Mapped to NestJS Services)

Tools are **thin wrappers** around existing NestJS services. They never bypass authorization and always reuse existing DTOs + Zod schemas from `@gotrippin/core`.

#### 4.1 Trip tools

- `createTripDraft`
  - Maps to trips service `createTrip` (or a dedicated `createDraftTrip`).
  - Inputs: `title?`, `destination?`, `start_date?`, `end_date?`.
  - Output: `{ trip_id, share_code, title, dates }`.

- `updateTrip`
  - Maps to trips service `updateTrip`.
  - Inputs: `trip_id`, partial trip fields (`title`, `start_date`, `end_date`, `color`, `image_url`).
  - Output: updated trip metadata.

#### 4.2 Route / locations tools

- `addLocation`
  - Maps to trip‑locations service `addLocation(tripId, data)`.
  - Inputs: `trip_id`, `location_name`, optional `coords`, optional dates, optional `order_index`.
  - Output: created `TripLocation`.

- `getRoute`
  - Maps to `getRoute(tripId)`.
  - Inputs: `trip_id`.
  - Output: ordered `TripLocation[]`.

- `reorderLocations`
  - Maps to `reorderLocations(tripId, { location_ids })`.
  - Inputs: `trip_id`, `location_ids: string[]`.

#### 4.3 Activities tools

- `addActivity`
  - Maps to activities service `createActivity`.
  - Inputs: `trip_id`, `location_id`, `type`, `title`, optional `timestamp`, optional `notes`.

- `getTimeline`
  - Maps to `getGroupedActivities(tripId)` and/or existing timeline helpers.

#### 4.4 Images / Unsplash tools

- `searchCoverImage`
  - Maps to images service `search`.
  - Inputs: `query`, optional `orientation`, `color`.

- `selectCoverImage`
  - Maps to images service `download` + trips update (trip `image_url`, blurhash if used).

#### 4.5 Weather tools

- `getTripWeather`
  - Maps to `GET /trips/:tripId/weather?days=...`.
  - Inputs: `trip_id`, optional `days`.

#### 4.6 Meta tools

- Optional: `updateMemorySlots`
  - Allows the model to write structured state into `ai_sessions.slots` explicitly (e.g. `{ destinationCountry, budgetRange, travelingWithKids }`).

All tool definitions should be:

- Implemented once in a **tool registry** inside `AiService` (or a dedicated `AiToolsService`).
- Exposed to the model as OpenAI‑style `tools` with JSON Schema derived from the Zod schemas in `@gotrippin/core` (via `zod-to-json-schema` or hand‑written JSON schema).

---

### 5. Memory Strategy (Summary + Slots)

The agent keeps **two layers of memory**:

1. **Short‑term context** — last N messages (kept in memory or `ai_messages`).
2. **Long‑term state** — `summary` + `slots` in `ai_sessions`.

Per turn:

1. Load `ai_sessions.summary` and `slots`.
2. Build a system prompt that:
   - Defines the agent role (AI trip planner).
   - Injects constraints (must use tools, must not invent data, must ask for confirmation, etc.).
   - Includes a compact representation of current `slots`.
3. Append recent messages and the new user message.
4. After the model responds and tools are executed:
   - Call the model again (or reuse the same call if the pattern is “stream of consciousness”) with a dedicated instruction:
     - “Update the session summary and slots JSON based on this interaction; output ONLY JSON in the specified format.”
   - Parse result and write back to `ai_sessions.summary` and `ai_sessions.slots`.

`slots` shape is intentionally loose (JSON). Example:

```json
{
  "current_trip_id": "…",
  "destination_country": "Spain",
  "duration_days": 10,
  "has_dates": true,
  "preferences": {
    "beach": true,
    "cities": ["Barcelona", "Madrid"]
  }
}
```

---

### 6. Frontend Integration (Phase 3)

#### 6.1 Global AI tab

New route in `apps/web/app/ai/page.tsx`:

- **Server component** shell:
  - Loads current user (via Supabase session).
  - Optionally creates a new global `ai_session` or fetches the last active one.
  - Passes `sessionId` and initial messages to a Client Component.

- **Client Component**, e.g. `AiChatClient`:
  - Renders chat history.
  - Sends `POST /ai/sessions/:id/messages` on user input.
  - Shows “thinking / executing tools” status inline (simple spinner + text is enough for v1).

#### 6.2 Trip‑scoped AI tab

New route `apps/web/app/trips/[id]/ai/page.tsx`:

- Receives `share_code` from the URL.
- Resolves to `trip_id` with existing `useTrip` / API helpers.
- Ensures the user is a trip member (same as overview page).
- Creates or resumes a **trip‑scoped** `ai_session` (`scope = 'trip'`, `trip_id` set).
- Reuses `AiChatClient`, but with additional context in the system prompt:
  - Trip name, dates, route summary, etc. (may be fetched server‑side and passed as initial messages).

#### 6.3 Integration with existing drawers

For v1, keep integration simple:

- When the assistant suggests setting dates or editing the route, it:
  - Uses tools to propose a draft (e.g. route stops, dates).
  - Sends a message like: “I’ve prepared a draft route. Click ‘Open Route Editor’ to review and apply.”
- UI shows a **button inside the chat** that:
  - Navigates to the existing route screen or opens the route drawer.
  - Once the user edits and saves, a small system/user message is appended to the chat summarizing what changed.

Full bidirectional, real‑time syncing between chat and drawers can be deferred; the important part for v1 is that **the same API and components are used**, not separate flows.

---

### 7. Phasing (Matches `features.todo`)

**Phase 1 — AI backend foundations**

- Create `ai_sessions` (and optional `ai_messages`) tables with RLS.
- Implement `AiModule`, `AiService`, basic `AiController` with `POST /ai/sessions`.
- Implement `OpenRouterClient` and verify glm‑5 calls work in isolation.
- Implement minimal tool registry for trips + locations (no activities/images yet).

**Phase 2 — Turn orchestration & tools**

- Implement the full `POST /ai/sessions/:id/messages` flow with:
  - Tool calling loop (limited depth).
  - Zod validation for all tool inputs.
  - Summary + slots update after each turn.
- Extend tools to cover activities, weather, and images where useful.

**Phase 3 — Web chat UI (global + trip‑scoped)**

- Add `/ai` and `/trips/[id]/ai` routes with shared `AiChatClient`.
- Implement optimistic UI for sending messages while requests are in flight.
- Show simple status messages when tools are executing (“Creating trip…”, “Adding stops…”, etc.).

**Phase 4 — Logging, metrics, rate limits**

- Add basic logging for:
  - Model latency and token counts (if available from OpenRouter).
  - Tool calls and errors.
- Add soft rate limits per user (e.g. max turns per minute/hour).
- Add admin‑friendly logs (even a simple table) to inspect AI issues when debugging.

**Phase 5 — Collaboration & advanced behaviors**

- Support multi‑user trip sessions with a simple “active turn lock” per trip.
- Surface presence / “who is using AI for this trip now”.
- Add richer behaviors:
  - “Shorten this trip by 2 days”, “move this stop later”, “add a relaxing day between these two cities”, etc.
- Evaluate if a secondary, more capable model is needed for particularly complex planning prompts (keep glm‑5 as default).

---

### 8. Non‑Goals for v1

- Voice input and TTS (can be layered on later; they only map to sending/reading chat messages).
- Full realtime multi‑cursor editing of trips via AI (collaboration for AI is limited to simple locks in Phase 5).
- Letting the LLM talk directly to Supabase or arbitrary HTTP endpoints — **all** actions must go through the existing NestJS tools for safety and consistency.

