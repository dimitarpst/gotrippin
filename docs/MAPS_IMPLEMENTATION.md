# 🗺️ Maps Implementation Guide

**Status:** 📋 Planned (Not Yet Implemented)  
**Last Updated:** December 2024

This document outlines the complete plan for implementing route selection, marking, and POI features across web and mobile platforms in gotrippin.

---

## 🎯 Goals

1. **Route Selection**: Users can select and preview routes on both web and mobile
2. **Route Marking**: Users can mark locations, waypoints, and custom points on maps
3. **Data Synchronization**: Routes created on web appear instantly on mobile (and vice versa)
4. **POI Integration**: Search and display Points of Interest using Google Places API
5. **Unified Experience**: Consistent map styling and functionality across platforms

---

## 🏗️ Architecture Decision

### **Chosen Solution:**

| Platform | Library | Provider | Why |
|----------|---------|----------|-----|
| **Web** | `react-map-gl` | Mapbox GL JS | Modern, customizable, great React support |
| **Mobile** | `react-native-maps` | Native (Apple Maps/Google Maps) | Mature, works with Expo & bare RN, free |
| **POI Search** | Google Places API | Google Cloud | Works with ANY map provider, best POI data |

### **Why This Stack?**

✅ **Data Sync**: Both platforms use Supabase (already in place)  
✅ **Google Places API**: Independent REST API - works with any map provider  
✅ **Cost Effective**: Free mobile maps, reasonable Mapbox pricing  
✅ **Modern**: Mapbox offers beautiful, customizable styling  
✅ **Flexible**: Can switch mobile to Mapbox later if needed  

---

## 📊 Data Architecture

### **Database Schema (Supabase)**

Routes will be stored in Supabase with the following structure:

```sql
-- Routes table
CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  name VARCHAR(255),
  description TEXT,
  
  -- Route geometry
  waypoints JSONB NOT NULL,  -- Array of {lat, lng, name, address}
  polyline TEXT,              -- Encoded route path (for efficient rendering)
  bounds JSONB,               -- {north, south, east, west} for map viewport
  
  -- Metadata
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Route settings
  travel_mode VARCHAR(20) DEFAULT 'driving',  -- driving, walking, cycling, transit
  avoid_tolls BOOLEAN DEFAULT false,
  avoid_highways BOOLEAN DEFAULT false
);

-- Route markers/POIs (custom user markers)
CREATE TABLE route_markers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  
  -- Location
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  name VARCHAR(255),
  description TEXT,
  address TEXT,
  
  -- Marker type
  marker_type VARCHAR(50) DEFAULT 'custom',  -- custom, poi, waypoint, accommodation, restaurant
  
  -- Google Places data (if from Places API)
  place_id VARCHAR(255),  -- Google Places place_id for future reference
  place_data JSONB,       -- Cached place details (photos, ratings, etc.)
  
  -- Visual
  color VARCHAR(7),       -- Hex color for marker pin
  icon VARCHAR(50),       -- Icon identifier
  
  -- Metadata
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_routes_trip_id ON routes(trip_id);
CREATE INDEX idx_routes_created_by ON routes(created_by);
CREATE INDEX idx_route_markers_route_id ON route_markers(route_id);
CREATE INDEX idx_route_markers_trip_id ON route_markers(trip_id);
CREATE INDEX idx_route_markers_location ON route_markers USING GIST (
  ll_to_earth(lat, lng)
);  -- Spatial index for location queries
```

### **RLS Policies**

```sql
-- Routes: Users can view routes for trips they're members of
CREATE POLICY "Users can view routes for their trips"
  ON routes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = routes.trip_id
      AND trip_members.user_id = auth.uid()
    )
  );

-- Routes: Users can create routes for trips they're members of
CREATE POLICY "Users can create routes for their trips"
  ON routes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM trip_members
      WHERE trip_members.trip_id = routes.trip_id
      AND trip_members.user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

-- Routes: Users can update/delete routes they created
CREATE POLICY "Users can update their routes"
  ON routes FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Users can delete their routes"
  ON routes FOR DELETE
  USING (created_by = auth.uid());

-- Similar policies for route_markers...
```

---

## 📦 Dependencies

### **Web App (`apps/web`)**

```bash
npm install react-map-gl mapbox-gl
npm install --save-dev @types/mapbox-gl
```

**Environment Variables:**
```env
# .env.local
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_google_api_key_here
```

### **Mobile App (Future - `apps/mobile`)**

```bash
npm install react-native-maps
# For iOS (if using bare React Native)
cd ios && pod install
```

**Environment Variables:**
```env
# .env
GOOGLE_PLACES_API_KEY=your_google_api_key_here
```

---

## 🗂️ File Structure

### **Web Components**

```
apps/web/src/components/maps/
├── MapView.tsx              # Main map container (react-map-gl)
├── RouteSelector.tsx         # Route selection UI & controls
├── RouteDisplay.tsx          # Display selected route on map
├── MarkerTool.tsx            # Tool for adding/editing markers
├── POISearch.tsx             # Google Places search component
├── RouteControls.tsx         # Travel mode, avoid options
└── MapControls.tsx          # Zoom, center, style controls
```

### **Shared Types (`packages/core`)**

```
packages/core/src/types/
├── route.ts                  # Route, Waypoint, RouteMarker types
└── map.ts                    # Map-related types (bounds, etc.)
```

### **Hooks**

```
apps/web/src/hooks/
├── useRoute.ts               # Fetch/create/update/delete routes
├── useRouteMarkers.ts        # Manage route markers
├── useGooglePlaces.ts        # Google Places API integration
└── useMapBounds.ts           # Map viewport management
```

---

## 🔧 Implementation Steps

### **Phase 1: Database Setup**

1. ✅ Create `routes` table in Supabase
2. ✅ Create `route_markers` table in Supabase
3. ✅ Set up RLS policies
4. ✅ Create spatial indexes for location queries
5. ✅ Add migration files (if using version control)

### **Phase 2: Core Types & Schemas**

1. ✅ Create `packages/core/src/types/route.ts`:
   ```typescript
   export interface Waypoint {
     lat: number;
     lng: number;
     name?: string;
     address?: string;
   }
   
   export interface Route {
     id: string;
     trip_id: string;
     name?: string;
     waypoints: Waypoint[];
     polyline?: string;
     travel_mode: 'driving' | 'walking' | 'cycling' | 'transit';
     // ... other fields
   }
   ```

2. ✅ Create Zod schemas for validation
3. ✅ Export types from `packages/core/src/index.ts`

### **Phase 3: Web Map Integration**

1. ✅ Install Mapbox dependencies
2. ✅ Create `MapView.tsx` component:
   - Initialize Mapbox map
   - Apply dark theme styling (matches app theme)
   - Handle viewport changes
   - Responsive design

3. ✅ Create `RouteSelector.tsx`:
   - Click-to-add waypoints
   - Drag to reorder waypoints
   - Delete waypoints
   - Route preview

4. ✅ Integrate Google Places API:
   - Create `POISearch.tsx` component
   - Autocomplete search
   - Place details fetching
   - Add POI as marker/waypoint

5. ✅ Create route display:
   - Render polyline on map
   - Show waypoint markers
   - Display route info (distance, duration)

### **Phase 4: Backend API (NestJS)**

1. ✅ Create `routes` module:
   - `routes.controller.ts` - CRUD endpoints
   - `routes.service.ts` - Business logic
   - `routes.module.ts` - Module definition

2. ✅ Endpoints:
   - `GET /routes/trip/:tripId` - Get all routes for a trip
   - `POST /routes` - Create new route
   - `PUT /routes/:id` - Update route
   - `DELETE /routes/:id` - Delete route
   - `GET /routes/:id` - Get single route

3. ✅ Create `markers` module (similar structure)

### **Phase 5: Data Synchronization**

1. ✅ Create `useRoute` hook:
   - Fetch routes from Supabase
   - Create/update/delete routes
   - Real-time subscriptions (Supabase Realtime)

2. ✅ Create `useRouteMarkers` hook:
   - Manage markers for a route
   - Sync with Supabase

3. ✅ Test cross-platform sync:
   - Create route on web → verify on mobile
   - Update route on mobile → verify on web

### **Phase 6: Mobile App (Future)**

1. ✅ Install `react-native-maps`
2. ✅ Create mobile `MapView` component
3. ✅ Reuse same hooks (`useRoute`, `useRouteMarkers`)
4. ✅ Implement touch-based route selection
5. ✅ Test data sync with web app

---

## 🎨 Styling & Theme

### **Mapbox Style (Dark Theme)**

Mapbox maps should match the app's "Aurora × Coral Dark Theme":

```typescript
const mapStyle = {
  version: 8,
  sources: {
    // Mapbox sources
  },
  layers: [
    // Custom dark theme layers
    // Primary accent: #ff6b6b (coral red)
    // Background: dark (#0a0a0a)
  ]
};
```

**Key Styling Points:**
- Dark base map (matches `#0a0a0a` background)
- Coral red (`#ff6b6b`) for route lines and selected markers
- Subtle glow effects on markers (glassmorphism style)
- Smooth animations (Framer Motion compatible)

---

## 🔌 Google Places API Integration

### **Setup**

1. Create Google Cloud project
2. Enable Places API
3. Get API key
4. Set up API key restrictions (HTTP referrers for web, app bundle for mobile)

### **Usage**

```typescript
// apps/web/src/lib/googlePlaces.ts
export async function searchPlaces(query: string, location?: { lat: number; lng: number }) {
  const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
  url.searchParams.set('query', query);
  url.searchParams.set('key', process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY!);
  if (location) {
    url.searchParams.set('location', `${location.lat},${location.lng}`);
    url.searchParams.set('radius', '5000');
  }
  
  const response = await fetch(url.toString());
  return response.json();
}

export async function getPlaceDetails(placeId: string) {
  // Fetch detailed place information
}
```

### **Features**

- ✅ Text search (restaurants, attractions, etc.)
- ✅ Autocomplete suggestions
- ✅ Place details (photos, ratings, reviews)
- ✅ Nearby search (within radius of map center)
- ✅ Add POI as marker or waypoint

---

## 💰 Cost Estimates

### **Mapbox (Web)**

- **Free Tier**: 50,000 map loads/month
- **After Free**: $5 per 1,000 loads
- **Example**: 1,000 active users/month = ~30,000 loads = **FREE**

### **Google Places API**

- **Free Tier**: $200 credit/month
- **Text Search**: $32 per 1,000 requests
- **Place Details**: $17 per 1,000 requests
- **Example**: 1,000 searches/month = ~$32 = **FREE** (within credit)

### **Mobile Maps**

- **react-native-maps**: **FREE** (uses native Apple Maps/Google Maps)

**Total Estimated Cost**: $0-50/month for typical usage

---

## 🧪 Testing Checklist

### **Web**

- [ ] Map loads correctly with dark theme
- [ ] Can add waypoints by clicking
- [ ] Can drag waypoints to reorder
- [ ] Route polyline displays correctly
- [ ] Google Places search works
- [ ] Can add POI as marker
- [ ] Route saves to Supabase
- [ ] Route updates in real-time (if another user edits)

### **Mobile (Future)**

- [ ] Map loads on iOS
- [ ] Map loads on Android
- [ ] Touch-based waypoint selection works
- [ ] Route syncs with web app
- [ ] Markers display correctly
- [ ] Google Places search works

### **Data Sync**

- [ ] Create route on web → appears on mobile
- [ ] Update route on mobile → updates on web
- [ ] Delete route → removed from both platforms
- [ ] Real-time updates work (Supabase Realtime)

---

## 📚 Resources

### **Documentation**

- [Mapbox GL JS Docs](https://docs.mapbox.com/mapbox-gl-js/)
- [react-map-gl Docs](https://visgl.github.io/react-map-gl/)
- [react-native-maps Docs](https://github.com/react-native-maps/react-native-maps)
- [Google Places API Docs](https://developers.google.com/maps/documentation/places/web-service)
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)

### **Mapbox Styling**

- [Mapbox Style Spec](https://docs.mapbox.com/mapbox-gl-js/style-spec/)
- [Mapbox Studio](https://studio.mapbox.com/) - Create custom styles

### **Google Places API**

- [Places API Overview](https://developers.google.com/maps/documentation/places/web-service/overview)
- [Places API Pricing](https://developers.google.com/maps/billing-and-pricing/pricing#places-api)

---

## 🚀 Getting Started (When Ready)

1. **Set up Mapbox account**:
   - Go to https://account.mapbox.com/
   - Create access token
   - Add to `.env.local`

2. **Set up Google Cloud**:
   - Create project at https://console.cloud.google.com/
   - Enable Places API
   - Create API key
   - Add to `.env.local`

3. **Run database migrations**:
   - Create `routes` and `route_markers` tables
   - Set up RLS policies

4. **Install dependencies**:
   ```bash
   cd apps/web
   npm install react-map-gl mapbox-gl
   ```

5. **Start building**:
   - Begin with `MapView.tsx` component
   - Add route selection functionality
   - Integrate Google Places API

---

## 📝 Notes

- **Console warnings (expected, harmless):**
  - **WEBGL_debug_renderer_info deprecated** – Firefox/browser WebGL; cannot fix in app code.
  - **WebGL texSubImage Alpha-premult / y-flip** – Mapbox GL texture uploads; safe to ignore.
  - **CORS to events.mapbox.com** – Mapbox telemetry; often blocked by ad blockers or privacy extensions. The map still works; no action needed.

- **Mapbox vs Google Maps**: We chose Mapbox for web because it offers better customization and modern React support. Google Places API works independently, so we get the best of both worlds.

- **Mobile Strategy**: Using `react-native-maps` initially (free, mature). Can migrate to `@rnmapbox/maps` later if we want unified styling.

- **Real-time Sync**: Supabase Realtime will enable live collaboration - when one user adds a waypoint, others see it instantly.

- **Offline Support**: Future consideration - Mapbox supports offline map tiles, which could be useful for travel apps.

---

**Ready to implement?** Start with Phase 1 (Database Setup) and work through each phase sequentially. All the planning is done - time to build! 🚀

