-- Optional per-stop map marker color (hex), same pattern as activities.color
ALTER TABLE public.trip_locations
ADD COLUMN IF NOT EXISTS marker_color text NULL
  CONSTRAINT trip_locations_marker_color_hex_chk CHECK (
    marker_color IS NULL OR marker_color ~ '^#[0-9A-Fa-f]{6}$'
  );

COMMENT ON COLUMN public.trip_locations.marker_color IS 'Optional #RRGGBB for map marker; when null, UI uses route palette by index.';
