-- Optional Google Places metadata for route stops (map thumbnails, peek details).
ALTER TABLE public.trip_locations
  ADD COLUMN IF NOT EXISTS google_place_id text NULL,
  ADD COLUMN IF NOT EXISTS photo_url text NULL,
  ADD COLUMN IF NOT EXISTS formatted_address text NULL;

COMMENT ON COLUMN public.trip_locations.google_place_id IS 'Google Places API place id (resource segment, without places/ prefix optional)';
COMMENT ON COLUMN public.trip_locations.photo_url IS 'Primary photo URL for map marker / UI (often Places photo media URL)';
COMMENT ON COLUMN public.trip_locations.formatted_address IS 'Display address from Places or search';
