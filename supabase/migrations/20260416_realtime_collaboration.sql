-- Trip member roles, trips.updated_at, RLS SELECT for Realtime (postgres_changes), replica identity, publication.

-- 1) Roles on trip_members
ALTER TABLE public.trip_members
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'editor'
    CHECK (role IN ('editor', 'viewer'));

COMMENT ON COLUMN public.trip_members.role IS 'editor can change trip data; viewer is read-only';

-- 2) trips.updated_at for optimistic locking + Realtime
ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

UPDATE public.trips SET updated_at = created_at WHERE updated_at IS NULL;

CREATE OR REPLACE FUNCTION public.trips_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trips_set_updated_at ON public.trips;
CREATE TRIGGER trips_set_updated_at
  BEFORE UPDATE ON public.trips
  FOR EACH ROW
  EXECUTE PROCEDURE public.trips_set_updated_at();

COMMENT ON COLUMN public.trips.updated_at IS 'Bumped on every trip row update (API + trigger)';

-- 3) Peer membership visibility (for Realtime on trip_members + co-member lists under RLS)
CREATE POLICY "trip_members_select_same_trip"
  ON public.trip_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.trip_members tm
      WHERE tm.trip_id = trip_members.trip_id
        AND tm.user_id = auth.uid()
    )
  );

-- 4) Core trip data: SELECT-only for members (writes stay via Nest service role)
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trips_select_members"
  ON public.trips
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.trip_members tm
      WHERE tm.trip_id = trips.id
        AND tm.user_id = auth.uid()
    )
  );

ALTER TABLE public.trip_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trip_locations_select_members"
  ON public.trip_locations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.trip_members tm
      WHERE tm.trip_id = trip_locations.trip_id
        AND tm.user_id = auth.uid()
    )
  );

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activities_select_members"
  ON public.activities
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.trip_members tm
      WHERE tm.trip_id = activities.trip_id
        AND tm.user_id = auth.uid()
    )
  );

-- 5) Restrict direct client writes on expenses/gallery to editors (defense in depth; Nest uses service role)
DROP POLICY IF EXISTS "trip_expenses_insert_members" ON public.trip_expenses;
DROP POLICY IF EXISTS "trip_expenses_update_members" ON public.trip_expenses;
DROP POLICY IF EXISTS "trip_expenses_delete_members" ON public.trip_expenses;

CREATE POLICY "trip_expenses_insert_members"
  ON public.trip_expenses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.trip_members tm
      WHERE tm.trip_id = trip_expenses.trip_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'editor'
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "trip_expenses_update_members"
  ON public.trip_expenses
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.trip_members tm
      WHERE tm.trip_id = trip_expenses.trip_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'editor'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.trip_members tm
      WHERE tm.trip_id = trip_expenses.trip_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'editor'
    )
  );

CREATE POLICY "trip_expenses_delete_members"
  ON public.trip_expenses
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.trip_members tm
      WHERE tm.trip_id = trip_expenses.trip_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'editor'
    )
  );

DROP POLICY IF EXISTS "trip_gallery_images_insert_members" ON public.trip_gallery_images;
DROP POLICY IF EXISTS "trip_gallery_images_delete_members" ON public.trip_gallery_images;

CREATE POLICY "trip_gallery_images_insert_members"
  ON public.trip_gallery_images
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.trip_members tm
      WHERE tm.trip_id = trip_gallery_images.trip_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'editor'
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "trip_gallery_images_delete_members"
  ON public.trip_gallery_images
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.trip_members tm
      WHERE tm.trip_id = trip_gallery_images.trip_id
        AND tm.user_id = auth.uid()
        AND tm.role = 'editor'
    )
  );

-- 6) Realtime: WAL + RLS-filtered delivery
ALTER TABLE public.trips REPLICA IDENTITY FULL;
ALTER TABLE public.trip_locations REPLICA IDENTITY FULL;
ALTER TABLE public.activities REPLICA IDENTITY FULL;
ALTER TABLE public.trip_members REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_locations;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.trip_members;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END;
$$;
