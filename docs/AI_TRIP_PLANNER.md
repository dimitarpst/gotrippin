## AI Trip Planner – Vision

### Goal

- **Single source of truth**: Every step of trip creation (trip draft, dates, route with stops on a map) is powered by the same backend APIs whether actions come from the normal UI or from an AI chat/voice agent.
- **Showcase feature**: The app does not need to be “everything”; it needs to demonstrate a **beautiful, modern route editor** that can be driven manually *and* by AI.

### High‑level flow (chat / voice)

1. **User intent**
   - Example: “I want to go to Venezuela in May for about 10 days.”

2. **Create draft trip**
   - Agent asks: “Should I create a trip for this?” → user confirms in chat.
   - Agent calls a backend function like `createTripDraft` and stores `trip_id`.

3. **Trip title**
   - Agent proposes a title (e.g. “Venezuela Adventure 2026”) based on the prompt.
   - Chat UI lets the user:
     - **Accept**,
     - **Regenerate**,
     - **Edit inline** (text input in chat).
   - Agent calls `updateTrip(tripId, { title })`.

4. **Trip dates**
   - Agent says: “Time to pick dates.”
   - Opens the **same date drawer** we use in the normal UI (no separate component).
   - User selects range → agent asks for confirmation (“Are these dates correct?”).
   - On confirm, agent calls `updateTrip(tripId, { start_date, end_date })`.

5. **Route creation**
   - Agent: “Now let’s build your route.”
   - Two modes (can mix):
     - **Conversational**: user describes stops and durations (“3 days in Caracas, 4 in Mérida, 3 in Los Roques”).
     - **Structured**: agent asks follow‑up questions for each stop.
   - For each stop the agent:
     - Resolves **coordinates** via Places / geocoding,
     - Picks or asks for a name,
     - Computes a date range (or asks),
     - Calls `addLocation(tripId, { location_name, location_coords, arrival_date, departure_date, order_index })`.

6. **Map + route editor sync**
   - The existing **map‑first route editor** (map + bottom sheet drawer) is the visual surface.
   - When the agent adds/updates/reorders locations, the same data flows into:
     - The **route list** in the drawer (names, dates, order),
     - The **markers + polyline** on the map.
   - User can **fine‑tune visually**:
     - Rename stops,
     - Change dates,
     - Reorder stops,
     - (Later) drag markers.

7. **Confirmation / refinement**
   - Agent keeps the user in the loop:
     - “Here’s the draft route I created. Want to tweak anything?”
     - Can accept high‑level changes (“shorten the trip by two days”, “add a stop in Bogotá”) and map them to the existing APIs.

### Backend/API building blocks

All AI behaviour should be implemented on top of explicit, reusable operations:

- `POST /trips` → **createTripDraft** (title optional).
- `PATCH /trips/:tripId` → update trip metadata (title, dates, etc.).
- `POST /trips/:tripId/locations` → add a new route stop.
- `GET /trips/:tripId/locations` → fetch ordered route.
- `PUT /trips/:tripId/locations/:id` → update a stop (name, coords, dates).
- `POST /trips/:tripId/locations/reorder` → reorder stops by id list.

These same endpoints are used by:

- The **normal UI** (route editor screen).
- The **AI planner** (through tools / function calls).

### UI integration notes

- The AI planner is a **separate full‑screen tab** that looks like chat.
- Chat messages can **open existing UI components** instead of custom ones:
  - Date selection uses the shared **date picker drawer**.
  - Route editing uses the **map + bottom sheet** route editor.
- Voice input is optional but mapped to the same chat layer (speech‑to‑text → prompts).

