---
name: maps-implementation
description: Applies Go Trippin maps architecture: Mapbox (web), react-native-maps (mobile), Google Places for POI. Use when implementing maps, routes, waypoints, markers, or POI search.
---

# Maps Implementation

## Stack (decided)

| Platform | Library | Provider | Why |
|----------|---------|----------|-----|
| **Web** | `react-map-gl` | Mapbox GL JS | Modern, customizable, great React support |
| **Mobile** | `react-native-maps` | Native (Apple/Google Maps) | Mature, free, works with Expo |
| **POI Search** | Google Places API | Google Cloud | Works with any map provider, best POI data |

**Data sync:** Both use Supabase. Routes/waypoints stored in DB; same data, different renderers.

---

## Dependencies

**Web:**
```bash
npm install react-map-gl mapbox-gl
```

**Env:** `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`, `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY`

**Mobile (future):**
```bash
npm install react-native-maps
```

---

## Data (existing)

`trip_locations` already has coordinates. Schema supports waypoints, polyline, bounds. See `MAPS_IMPLEMENTATION.md` for `routes` and `route_markers` tables (planned).

**Shared types in `@gotrippin/core`:**
- `Waypoint`: `{ lat, lng, name?, address? }`
- `Route`, `RouteMarker` types

---

## Styling

Mapbox: dark theme matching app (`#0a0a0a` background, `#ff6b6b` coral accent). Custom style via Mapbox Studio or style spec.

---

## Implementation order

1. **Database** – Create `routes`, `route_markers` tables + RLS (if not done).
2. **Types** – Add route/marker types to `@gotrippin/core`.
3. **Web MapView** – `react-map-gl`, dark theme.
4. **RouteSelector** – Click-to-add waypoints, drag reorder.
5. **Google Places** – POISearch component, autocomplete, place details.
6. **NestJS** – `routes` and `markers` modules (CRUD).
7. **Hooks** – `useRoute`, `useRouteMarkers`, `useGooglePlaces`.
8. **Mobile** – `react-native-maps` MapView, reuse hooks.

---

## Cost (typical usage)

- Mapbox: 50k loads/month free; ~$0–50/month.
- Google Places: $200 credit/month; usually free.
- Mobile maps: free (native).

---

## Rules

- Coordinates in `trip_locations` for weather/AI.
- POI search via Google Places; can live in NestJS for both web and RN.
- Real-time sync via Supabase Realtime.

## Full reference

See `docs/MAPS_IMPLEMENTATION.md` for schema, RLS, file structure, and phase checklist.
