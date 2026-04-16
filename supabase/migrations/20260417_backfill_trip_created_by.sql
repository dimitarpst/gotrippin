-- trips.created_by: add if missing (older DBs may never have had this column), then backfill.
ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users (id) ON DELETE SET NULL;

COMMENT ON COLUMN public.trips.created_by IS 'User who created the trip; creator-only actions (e.g. member roles).';

-- Legacy rows: set from a stable first member when null.
UPDATE public.trips AS t
SET created_by = sub.user_id
FROM (
  SELECT DISTINCT ON (trip_id) trip_id, user_id
  FROM public.trip_members
  ORDER BY trip_id, user_id ASC
) AS sub
WHERE t.id = sub.trip_id
  AND t.created_by IS NULL;
