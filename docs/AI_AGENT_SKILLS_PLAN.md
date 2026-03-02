# AI Agent & Skills Plan (from existing bot)

**Status:** Planning. Not yet implemented.  
**Related:** `features.todo` (AI operator), `docs/AI_OPERATOR_IMPLEMENTATION.md`, `docs/AI_TRIP_PLANNER.md`, `docs/plan.md`

---

## What we have today

- **AI backend:** Sessions (global + trip-scoped), OpenRouter/glm-5, turn handling, tool execution loop.
- **Tools implemented:** `createTripDraft`, `updateTrip`, `addLocation`, `getRoute`, `reorderLocations`, `getUserTrips`. All go through NestJS (Trips, TripLocations). No images/weather in the agent yet.
- **Web chat:** `/ai` and trip-scoped AI with `AiTestClient` — markdown, edit message, loading/error states. Input is a single text field with Send on the **right**; no “actions” or “skills” UI.

---

## Your flow: intent → two options (buttons) → trip walkthrough

**Idea (discussion):**

1. **User says something like:** “Hey I wanna go to Bali”
2. **AI detects intent** (user is talking about a destination / possibly wants to plan a trip) and answers in a friendly way, then **offers two choices as buttons**:
   - **“Create a trip”** — start the guided trip-creation flow with the AI
   - **“Just chat”** — no trip, keep it conversational
3. **If user taps “Create a trip”:** the AI runs the **same kind of walkthrough as the manual create-trip flow**, but in chat: create draft → title → dates → route/stops (using the existing tools: `createTripDraft`, `updateTrip`, `addLocation`, etc.). Same steps, driven by conversation instead of the wizard UI.
4. **If user taps “Just chat”:** the AI stays in chat mode, no trip created, no tools unless the user asks for something later.

So: **detect intent → surface two clear actions as buttons → if “create trip”, do the full create-trip walkthrough via AI.** The “+” skills menu can still sit alongside this (e.g. for “find images” or “add to route” later); the **first-class** flow is this intent → buttons → optional walkthrough.

---

## Where we’re heading (from docs + your direction)

1. **Agent = same AI bot, more capable**
   - Same session + tools architecture; add more tools and a clear “skills” surface in the UI so the agent can help with specific actions (find images, create trip, etc.).

2. **“+” icon to the left of the input → actions / allowed skills**
   - Clicking **+** opens a menu (or popover) of **available skills/actions**, e.g.:
     - **Find images** — search Unsplash (e.g. “sunset beach Barcelona”) and optionally set as trip cover.
     - **Create a trip** — start a new trip (can prefill from conversation).
     - **Add to route** — add a stop to the current trip (trip context required).
     - *(Others as we add tools: weather, activities, etc.)*
   - UX options (to decide):
     - **A)** User picks a skill → we send a structured hint with the message (e.g. “prefer use searchCoverImage”) so the model is nudged toward that tool.
     - **B)** User picks a skill → we inject a short system-style or user-style prompt (e.g. “User wants to search for cover images. Query: …”) so the agent clearly knows the intent.
     - **C)** Just **discoverability**: the menu only shows what the agent *can* do; user still types freely and the model chooses tools as today.

3. **Backend: add Unsplash tools (already in AI_OPERATOR_IMPLEMENTATION.md)**
   - **searchCoverImage** — maps to existing `ImagesService.searchImages(query, page?, perPage?)`. Inputs: `query`, optional `orientation`, `color` (if we expose them). Output: list of image results (urls, attribution, ids) so the agent can suggest or describe them.
   - **selectCoverImage** — when user/agent picks an image for a trip: call images download/track + `TripsService.updateTrip(tripId, { image_url, blur_hash })`. Inputs: `trip_id`, image identifier (e.g. Unsplash id + urls for download_location).
   - Images module already exists; we only need to register these in the AI tool catalog and `ToolExecutor`, with Zod validation and auth (user must be trip member for selectCoverImage).

---

## Concrete next steps (when you’re ready)

| # | Task | Notes |
|---|------|--------|
| 1 | **Backend: Unsplash tools** | Add `searchCoverImage` and `selectCoverImage` to `tool-definitions.ts` and `tool-executor.ts`; inject `ImagesService` (and possibly `TripsService` if not already) into `ToolExecutor`. |
| 2 | **Frontend: + button and skills menu** | To the **left** of the chat input, add a **+** icon button. On click, show a popover/dropdown listing “skills” (Find images, Create trip, Add stop to route, …). Each skill maps to a known tool or intent. |
| 3 | **Wire skill selection to message** | Decide A/B/C above; implement so that choosing a skill (and any params, e.g. search query) either attaches a hint to the next message or injects a short intent phrase so the agent uses the right tool. |
| 4 | **Optional: scope skills by context** | In trip-scoped chat, show “Set trip cover image” / “Add stop”; in global chat, show “Create trip” / “Find images” (no trip_id until one is created or selected). |

---

## References

- **Tool catalog (backend):** `apps/backend/src/ai/tools/tool-definitions.ts`, `tool-executor.ts`
- **Chat input (frontend):** `apps/web/app/ai/AiTestClient.tsx` — floating input area (~line 383), currently `[Input][Send]`; add `[+]` to the left.
- **Images API:** `apps/backend/src/images/images.service.ts` (`searchImages`, `trackDownload`, and download/store if we use it for cover).
- **Vision doc:** `docs/AI_TRIP_PLANNER.md` — agent creates/updates trips and route via same APIs as the UI; `docs/plan.md` — “fetchUnsplashOptions” and whitelisted tools.

When you’re ready to implement, we can do backend tools first, then the + and skills UI, and then connect the two (e.g. hint or intent injection).
