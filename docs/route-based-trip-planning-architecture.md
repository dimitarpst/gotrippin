# Route-Based Trip Planning Architecture

## Overview

This document outlines the architecture for implementing route-based trip planning in Go Trippin'. The core concept is that trips are built around **routes** (A → B → C → D), with activities attached to specific locations in the route, and weather fetched per location.

## Core Concept

**Route-First Planning:**
- Users must define a route (at least a starting stop) before adding activities
- Route consists of ordered locations: A → B → C → D
- Activities are attached to specific locations in the route
- Weather is fetched per location, not per trip
- Route is editable (add/remove/reorder locations)

**Example Flow:**
1. User creates trip "Spain Adventure"
2. Define route: Sofia (Bulgaria) → Madrid (Spain) → Barcelona (Spain) → Sofia (start with one stop, then add destinations)
3. Add activities to each location:
   - Sofia: Packing, Flight booking
   - Madrid: Hotel check-in, Museum visit, Restaurant
   - Barcelona: Beach day, Shopping, Flight home
4. Weather shows forecast for each location

## Inspiration References

The following UI patterns from your inspiration images should be implemented:

1. **Map + Calendar View** - Map showing route with calendar overlay for date selection
2. **Day-by-Day Timeline** - Vertical timeline showing activities per day/location
3. **Route Visualization** - Clear visualization of the route path
4. **Activity Cards** - Activities displayed as cards with icons, times, and locations

## Database Schema

### New Table: `trip_locations`

Stores the route for each trip - ordered locations that make up the journey.

```sql
CREATE TABLE public.trip_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  location_name VARCHAR(200) NOT NULL, -- e.g., "Sofia", "Madrid", "Barcelona"
  location_coords POINT, -- Optional: lat/lon for precise weather (PostGIS point type)
  order_index INTEGER NOT NULL, -- Defines route order (1, 2, 3...)
  arrival_date TIMESTAMPTZ, -- When you arrive at this location
  departure_date TIMESTAMPTZ, -- When you leave (null if last location)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure unique order per trip
  UNIQUE(trip_id, order_index),
  
  -- Ensure valid order
  CHECK (order_index > 0)
);

-- Index for fast lookups
CREATE INDEX idx_trip_locations_trip_id ON public.trip_locations(trip_id);
CREATE INDEX idx_trip_locations_order ON public.trip_locations(trip_id, order_index);
```

**RLS Policies:**
```sql
-- Users can view locations for trips they're members of
CREATE POLICY "Users can view trip locations for their trips"
  ON public.trip_locations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_members
      WHERE trip_members.trip_id = trip_locations.trip_id
      AND trip_members.user_id = auth.uid()
    )
  );

-- Users can manage locations for trips they're members of
CREATE POLICY "Users can manage trip locations for their trips"
  ON public.trip_locations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.trip_members
      WHERE trip_members.trip_id = trip_locations.trip_id
      AND trip_members.user_id = auth.uid()
    )
  );
```

### Updated Table: `activities`

Add `location_id` to link activities to route locations.

```sql
-- Add location_id column to activities table
ALTER TABLE public.activities
ADD COLUMN location_id UUID REFERENCES public.trip_locations(id) ON DELETE SET NULL;

-- Index for fast lookups
CREATE INDEX idx_activities_location_id ON public.activities(location_id);
```

**Note:** `location_id` should be nullable initially for migration, but eventually should be required for new activities.

### Updated Activity Schema

```typescript
export interface Activity {
  id: string;
  trip_id: string;
  location_id: string; // NEW: Required - links to trip_locations
  type: ActivityType;
  title: string;
  notes?: string;
  timestamp?: string; // Specific time for this activity
  created_at: string;
}
```

## TypeScript Types

### New Types in `packages/core/src/types/trip.ts`

```typescript
export interface TripLocation {
  id: string;
  trip_id: string;
  location_name: string;
  location_coords?: {
    lat: number;
    lon: number;
  } | null;
  order_index: number;
  arrival_date: string | null;
  departure_date: string | null;
  created_at: string;
}

export interface CreateTripLocation {
  trip_id: string;
  location_name: string;
  location_coords?: { lat: number; lon: number };
  order_index: number;
  arrival_date?: string;
  departure_date?: string;
}

export interface UpdateTripLocation {
  location_name?: string;
  location_coords?: { lat: number; lon: number } | null;
  order_index?: number;
  arrival_date?: string | null;
  departure_date?: string | null;
}
```

### Updated Activity Type

```typescript
export interface Activity {
  id: string;
  trip_id: string;
  location_id: string; // NEW: Required
  type: ActivityType;
  title: string;
  notes?: string;
  timestamp?: string;
  created_at: string;
}
```

## Backend Implementation

### New Module: `apps/backend/src/trip-locations/`

**Files to create:**
- `trip-locations.module.ts`
- `trip-locations.service.ts`
- `trip-locations.controller.ts`
- `dto/create-trip-location.dto.ts`
- `dto/update-trip-location.dto.ts`
- `dto/reorder-locations.dto.ts`

**Key Endpoints:**
```
POST   /api/trips/:tripId/locations          - Add location to route
GET    /api/trips/:tripId/locations          - Get all locations in route (ordered)
PUT    /api/trips/:tripId/locations/:id      - Update location
DELETE /api/trips/:tripId/locations/:id      - Remove location
POST   /api/trips/:tripId/locations/reorder  - Reorder locations (bulk update)
```

**Service Methods:**
- `addLocation(tripId, locationData)` - Add location, auto-calculate order_index
- `getRoute(tripId)` - Get all locations ordered by order_index
- `updateLocation(locationId, updateData)` - Update location
- `removeLocation(locationId)` - Remove and reorder remaining
- `reorderLocations(tripId, newOrder)` - Bulk reorder (e.g., [locationId1, locationId2, ...])

### Updated Module: `apps/backend/src/activities/`

**Changes needed:**
- Update activity creation to require `location_id`
- Add validation: `location_id` must belong to the same `trip_id`
- Update queries to include location data

## Frontend Implementation

### Route Builder Component

**File:** `apps/web/src/components/trips/route-builder.tsx`

**Features:**
- Map visualization of route (optional, can be list view)
- Add/remove locations
- Drag-and-drop reordering
- Set arrival/departure dates per location
- Required step in trip creation flow

**UI Flow:**
1. Start location input (required)
2. Add destination(s) with "+" button
3. Can add intermediate stops
4. Visual route path (A → B → C → D)
5. Edit/delete/reorder locations

### Updated Trip Creation Flow

**File:** `apps/web/src/components/trips/create-trip.tsx`

**New Flow:**
1. Basic trip info (title, dates, image/color)
2. **Route Builder (REQUIRED)** - Must define at least 2 locations
3. Save trip
4. Redirect to trip overview

**Validation:**
- Minimum 2 locations required (start + end)
- Route must be defined before trip can be saved
- No workaround - route is mandatory

### Activity Creation Updates

**File:** `apps/web/src/components/trips/activity-selector.tsx` (or new component)

**Changes:**
- Location selector (dropdown/list of route locations)
- Activities grouped by location
- Timeline view showing activities per location/day

### Weather Integration Updates

**Weather Widget:**
- Show weather for all locations in route
- Or show weather for selected location
- Weather detail page shows forecast per location

**Files to update:**
- `apps/web/src/components/trips/weather-widget.tsx` - Accept `location_id` or show all
- `apps/web/app/trips/[id]/weather/page.tsx` - Show weather per location

## User Experience Flow

### Creating a Trip

1. **Trip Basics**
   - Title: "Spain Adventure"
   - Dates: Nov 15 - Nov 25
   - Image/Color selection

2. **Route Builder (REQUIRED)**
   - "Where are you starting?" → Sofia, Bulgaria
   - "Add destination" → Madrid, Spain
   - "Add stop" → Barcelona, Spain
   - "Final destination" → Sofia, Bulgaria (return)
   - Route: Sofia → Madrid → Barcelona → Sofia
   - Set dates: Arrival in Madrid (Nov 16), Barcelona (Nov 20), Return (Nov 25)

3. **Save Trip**
   - Trip created with route
   - Redirect to trip overview

### Adding Activities

1. **Select Location**
   - User sees route: Sofia → Madrid → Barcelona → Sofia
   - Selects "Madrid" location

2. **Add Activity**
   - Activity type: Restaurant
   - Title: "Tapas at El Mercado"
   - Time: 7:00 PM
   - Automatically linked to Madrid location

3. **View Timeline**
   - Activities grouped by location
   - Day-by-day view showing activities per location

### Weather Display

1. **Trip Overview**
   - Weather widget shows weather for all locations
   - Or tabs to switch between locations

2. **Location Detail**
   - Click on location → See activities + weather for that location

3. **Weather Page**
   - Shows forecast for each location in route
   - Organized by location/date

## Implementation Phases

### Phase 1: Database & Backend (Foundation) ✅ COMPLETED

**Status:** Completed on Nov 25, 2025

**Tasks:**
1. ✅ Create `trip_locations` table migration
2. ✅ Create `activities` table with `location_id` FK
3. ✅ Create `trip-locations` module in backend
4. ✅ Create `activities` module with location validation
5. ✅ Add RLS policies (SELECT/INSERT/UPDATE/DELETE)
6. ✅ Update TypeScript types in `@gotrippin/core`

**Files created:**
- Migration: `20251125_create_trip_locations_table` (via Supabase MCP)
- Migration: `20251125_create_activities_table` (via Supabase MCP)
- `apps/backend/src/trip-locations/` (entire module)
  - `trip-locations.module.ts`
  - `trip-locations.service.ts`
  - `trip-locations.controller.ts`
  - `dto/create-trip-location.dto.ts`
  - `dto/update-trip-location.dto.ts`
  - `dto/reorder-locations.dto.ts`
- `apps/backend/src/activities/` (entire module)
  - `activities.module.ts`
  - `activities.service.ts`
  - `activities.controller.ts`
  - `dto/create-activity.dto.ts`
  - `dto/update-activity.dto.ts`
- `packages/core/src/schemas/trip.ts` (TripLocation + Activity schemas)

**API Endpoints:**
- `GET /trips/:tripId/locations` - Get all locations (route)
- `POST /trips/:tripId/locations` - Add location
- `GET /trips/:tripId/locations/:locationId` - Get single location
- `PUT /trips/:tripId/locations/:locationId` - Update location
- `DELETE /trips/:tripId/locations/:locationId` - Delete location
- `POST /trips/:tripId/locations/reorder` - Reorder locations
- `GET /trips/:tripId/activities` - Get all activities
- `GET /trips/:tripId/activities/grouped` - Get activities grouped by location
- `POST /trips/:tripId/activities` - Create activity
- `GET /trips/:tripId/activities/:activityId` - Get single activity
- `PUT /trips/:tripId/activities/:activityId` - Update activity
- `DELETE /trips/:tripId/activities/:activityId` - Delete activity
- `GET /trips/:tripId/weather?days=5` - Get per-stop forecasts for a trip (auth required; uses trip route)

### Phase 2: Route Builder UI ✅ COMPLETED

**Status:** Completed (Dice UI sortable route builder + trip creation wizard)

**Notes:**
- Route builder uses Dice UI Sortable (dnd-kit) with ordered stops.
- Trip creation flow includes route step; allows starting with a single stop and encourages adding destinations.
- Inline date picker per stop; copy clarified for “first stop” vs destinations.

**Files touched:**
- `apps/web/src/components/trips/route/route-builder.tsx`
- `apps/web/src/components/trips/route/location-card.tsx`
- `apps/web/src/components/trips/create-trip.tsx`

### Phase 3: Activity-Location Linking & Timeline Surface ✅ COMPLETED

**Status:** Completed (activities now attach to route stops; timeline implemented)

**Notes:**
- Activity forms require `location_id`; stop selector surfaces route stops.
- Grouped activities endpoint consumed via `useTripTimeline`; timeline page `/trips/[share]/timeline` live.
- Overview itinerary card uses timeline data and “View All Days” navigates to timeline.

**Files touched (high level):**
- `apps/web/src/lib/api/activities.ts`, `apps/web/src/hooks/useTripTimeline.ts`
- Activity forms and selector (`activity-selector`, lodging/train/flight forms)
- Timeline page/components and trip overview integration

### Phase 4: Weather Per Location (In Progress)

**Status:** Backend per-trip weather endpoint live; frontend integration in progress.

**Notes:**
- Endpoint: `GET /trips/:tripId/weather?days=5` (auth required), returns per-stop forecasts using the trip route.
- Uses Tomorrow.io via backend-only calls; falls back to location name when coords missing.
- Forecast capped at requested days (max 14) and cached server-side.
- Env: `TOMORROW_IO_API_KEY` required on backend.

**Tasks:**
1. Update weather API to accept route locations and return per-stop forecasts ✅
2. Update weather widget to show weather per location (timeline/overview) ⏳
3. Weather detail page shows forecast per location (upcoming)
4. Weather cards in trip overview per location (in progress)

**Files to update:**
- `apps/web/src/components/trips/weather-widget.tsx`
- `apps/web/app/trips/[id]/weather/page.tsx`
- `apps/web/src/hooks/useWeather.ts`
- Backend weather service (accepts trip route) ✅

## Technical Considerations

### Location Coordinates

**Option 1: Store as separate lat/lon columns**
```sql
latitude DECIMAL(10, 8),
longitude DECIMAL(11, 8)
```

**Option 2: Use PostGIS POINT type**
```sql
location_coords POINT
```

**Recommendation:** Start with `location_name` (string) for simplicity. Tomorrow.io API accepts city names. Add coordinates later if needed for precise weather.

### Route Reordering

When a location is removed or reordered:
1. Update `order_index` for affected locations
2. Update `arrival_date`/`departure_date` if dates are auto-calculated
3. Activities keep their `location_id` (no orphaned activities)

### Date Management

**Option A: Auto-calculate dates**
- User sets trip start_date and end_date
- Locations auto-distribute across trip duration
- User can manually adjust per location

**Option B: Manual dates**
- User sets arrival_date for each location
- Departure_date = next location's arrival_date (or trip end_date)

**Recommendation:** Option B - gives users more control.

### Migration Strategy

**For existing trips:**
1. Create default route from `trip.destination`
   - Location 1: User's home (if available) or trip destination
   - Location 2: `trip.destination`
2. Link existing activities to default location (if any)
3. User can edit route later

## API Design

### Trip Locations Endpoints

```typescript
// Get route for a trip
GET /api/trips/:tripId/locations
Response: TripLocation[] (ordered by order_index)

// Add location to route
POST /api/trips/:tripId/locations
Body: {
  location_name: string;
  location_coords?: { lat: number; lon: number };
  order_index?: number; // Auto-calculated if not provided
  arrival_date?: string;
  departure_date?: string;
}

// Update location
PUT /api/trips/:tripId/locations/:locationId
Body: {
  location_name?: string;
  location_coords?: { lat: number; lon: number } | null;
  order_index?: number;
  arrival_date?: string | null;
  departure_date?: string | null;
}

// Remove location
DELETE /api/trips/:tripId/locations/:locationId
// Automatically reorders remaining locations

// Reorder locations (bulk)
POST /api/trips/:tripId/locations/reorder
Body: {
  location_ids: string[]; // New order
}
```

### Updated Activity Endpoints

```typescript
// Create activity (now requires location_id)
POST /api/trips/:tripId/activities
Body: {
  location_id: string; // REQUIRED
  type: ActivityType;
  title: string;
  notes?: string;
  timestamp?: string;
}

// Get activities (filtered by location)
GET /api/trips/:tripId/activities?location_id=xxx
```

## Weather Integration

### Weather Per Location

**Backend:**
- Weather service accepts `location_name` (from `trip_locations`)
- Can fetch weather for multiple locations in one request (or separate requests)

**Frontend:**
- Weather widget shows weather for selected location
- Or shows weather cards for all locations in route
- Weather detail page: tabs or sections per location

**Example:**
```typescript
// Fetch weather for a location in the route
GET /api/weather/timeline?location=Madrid&startDate=2024-11-16&endDate=2024-11-20
```

## UI/UX Patterns (From Inspiration)

### 1. Map + Calendar View
- Map showing route path
- Calendar overlay for date selection
- Locations marked on map
- Click location → see activities + weather

### 2. Day-by-Day Timeline
- Vertical timeline (like inspiration images)
- Activities grouped by day/location
- Time indicators
- Location headers
- Weather shown per day/location

### 3. Route Visualization
- Clear path: A → B → C → D
- Drag-and-drop reordering
- Add/remove locations inline
- Visual connection between locations

### 4. Activity Cards
- Icon-based activity types
- Location name displayed
- Time displayed
- "View Details" link
- Grouped by location/day

## Timeline Experience Specification

### Purpose
- Provide a condensed "today" view inspired by the provided screenshots (calendar ribbon + stacked agenda).
- Surface weather, travel segments, and activities per day/location without forcing the user to open individual cards.
- Act as the primary entry point for managing the trip once the route is defined (Phase 3+).

### Layout Stack
1. **Header & Trip Meta**
   - Month/year indicator and active trip name (e.g., "November 2025 · Франция").
   - Secondary text shows current location ("Today, Şişli") calculated from `trip_locations` dates.
2. **Calendar Strip**
   - Seven-day rolling view with weekday abbreviations + day numbers.
   - Current day uses accent fill (`--color-accent`) with small dot indicator; past/future days use muted text.
   - Interaction: swipe/scroll horizontally on mobile, arrow buttons on desktop.
3. **Hero Cards**
   - **Weather card**: pulls from `/weather/timeline`, highlights alerts (e.g., "Daily Forecast PRO · bring umbrella").
   - **Upcoming segment card**: next travel block (e.g., "Macka Cd. → Hotel Bulgaria" with departure time + transport icon).
4. **Daily Agenda List**
   - Each day rendered as collapsible section:
     - Caption: `DAY_NAME, DD MONTH` + ordinal (1st, 2nd…).
     - Row items: icon badge (activity type), title, time, quick actions (edit/delete/more).
     - Empty state: CTA "Add activity" referencing route location.
5. **Floating Actions**
   - Persistent bottom bar with primary action (`+` to add activity/segment) and secondary actions (filters, view switch).

### Interaction Rules
- Selecting a date updates:
  - Highlight state in calendar strip.
  - Current location context (derived from route order and arrival/departure range).
  - Weather widget + agenda list filtered to that day/location.
- Swiping between days animates hero cards with `framer-motion` spring (`stiffness 600, damping 25` as per theme).
- `+` button opens Activity Selector pre-filtered for the chosen location.
- Long-press/ellipsis on agenda items opens detail sheet (edit, duplicate, move to another day).

### Data Dependencies
- `trip_locations`: provides ordered list, arrival/departure dates, and location names for labels.
- `activities`: must include `location_id`, `timestamp`, `type`, `notes`.
- `weather` service: `GET /api/weather/timeline?location=<city>&startDate=<day>&endDate=<day>` cached via backend.
- Optional `segments` (future) share same structure as activities with `type="transport"` to render travel rows.

### State Handling
- **Loading**: shimmer skeleton for calendar strip + cards; agenda shows placeholder rows.
- **No activities**: show weather + CTA card "Start planning" with quick suggestions (Flights, Lodging, Activities).
- **Offline/fetch error**: show non-blocking toast + fallback text; maintain local cache of last known data.
- **Multiple collaborators**: subscribe to Supabase Realtime on `activities` and `trip_locations` to refetch current day.

### Implementation Phases Alignment
- **Phase 3 (Activity-Location Linking)**: build static timeline using existing data endpoints (no maps yet).
- **Phase 4 (Weather Per Location)**: enrich hero cards with real forecasts and alerts.
- **Phase 5+ (Realtime/Maps)**: hook timeline selections to the map view (selecting a day highlights corresponding leg).

### Component Breakdown (`apps/web/src/components/trips/`)
- `timeline/timeline-shell.tsx`: orchestrates data fetching, layout, and navigation state.
- `timeline/date-carousel.tsx`: horizontal calendar strip with keyboard + drag controls.
- `timeline/weather-pill.tsx`: weather summary for selected location/day (supports warning badges).
- `timeline/agenda-day.tsx`: renders individual day card with activities + empty state CTA.
- `timeline/segment-card.tsx`: reusable piece for transport segments (flights, trains, car rides).

### Accessibility & Localization
- All date labels and ordinals pulled from `i18next` using locale-aware formatters.
- Ensure focus order flows from calendar strip → hero cards → agenda list.
- Provide ARIA labels for timeline controls (e.g., "Go to Wednesday, 26 November").

## Validation Rules

### Route Validation
- Minimum 1 location required (trip start); recommend 2+ to form a route
- `order_index` must be sequential (1, 2, 3, ...)
- No gaps in order_index
- Location names required (non-empty)
- If dates provided: `arrival_date` <= `departure_date`
- If dates provided: `departure_date` <= next location's `arrival_date` (or trip end_date)

### Activity Validation
- `location_id` is required
- `location_id` must belong to the same `trip_id`
- `timestamp` (if provided) should be within location's date range

## Future Enhancements

1. **Route Optimization**
   - Suggest optimal route order based on distances
   - Auto-calculate travel times between locations

2. **Location Details**
   - Store additional location info (address, timezone, etc.)
   - Integration with Google Maps/Places API

3. **Multi-Modal Routes**
   - Flight segments (A → B)
   - Train segments (B → C)
   - Car rental segments (C → D)

4. **Route Templates**
   - Pre-defined routes for popular destinations
   - Share routes between users

5. **Collaborative Route Planning**
   - Multiple users can edit route
   - Route suggestions/voting

## Migration Notes

### Existing Trips

For trips created before route system:
1. Create default route from `trip.destination`:
   ```sql
   INSERT INTO trip_locations (trip_id, location_name, order_index)
   SELECT id, destination, 1
   FROM trips
   WHERE destination IS NOT NULL;
   ```

2. Link existing activities (if any) to default location
3. User can edit route later to add more locations

### Backward Compatibility

- `trip.destination` field can remain (for display/search)
- Route system is the source of truth for locations
- Weather uses route locations, not `trip.destination`

## Testing Checklist

- [ ] Create trip with route (2+ locations)
- [ ] Add/remove locations from route
- [ ] Reorder locations
- [ ] Add activities to specific locations
- [ ] View activities grouped by location
- [ ] Weather fetched per location
- [ ] Route validation (min 2 locations)
- [ ] RLS policies working correctly
- [ ] Migration for existing trips
- [ ] Timeline view showing activities per location/day

## Next Steps

1. Integrate weather per location (Phase 4)
   - Backend weather service accepting route locations ✅
   - Frontend weather widgets/cards per stop and in timeline (in progress)
2. Maps + route visualization (Phase 5)
   - Polyline for ordered stops; per-leg summary in overview/timeline
3. UX polish & QA
   - Empty/single-stop states, per-stop helpers, loading/error paths
   - E2E: create trip → add stops → add activities → timeline/weather

---

**Last Updated:** 2025-12-08
**Status:** Phases 1–3 completed; Phase 4 (weather) in progress; maps next

