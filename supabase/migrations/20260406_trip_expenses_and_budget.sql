-- Optional trip-level budget cap (minor units, e.g. cents; ISO 4217 currency)
ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS budget_amount_minor integer NULL
    CHECK (budget_amount_minor IS NULL OR budget_amount_minor >= 0),
  ADD COLUMN IF NOT EXISTS budget_currency text NULL
    CHECK (
      budget_currency IS NULL
      OR (char_length(budget_currency) = 3 AND budget_currency = upper(budget_currency))
    );

COMMENT ON COLUMN public.trips.budget_amount_minor IS 'Optional total budget in minor currency units (e.g. cents)';
COMMENT ON COLUMN public.trips.budget_currency IS 'ISO 4217 code for budget_amount_minor; uppercase';

-- Per-trip expenses; optional link to stop and/or activity
CREATE TABLE IF NOT EXISTS public.trip_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips (id) ON DELETE CASCADE,
  location_id uuid NULL REFERENCES public.trip_locations (id) ON DELETE SET NULL,
  activity_id uuid NULL REFERENCES public.activities (id) ON DELETE SET NULL,
  amount_minor integer NOT NULL CHECK (amount_minor > 0),
  currency_code text NOT NULL CHECK (char_length(currency_code) = 3 AND currency_code = upper(currency_code)),
  title text NOT NULL CHECK (char_length(trim(title)) >= 1 AND char_length(title) <= 200),
  notes text NULL,
  category text NULL,
  spent_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trip_expenses_trip_id_spent_at_idx
  ON public.trip_expenses (trip_id, spent_at DESC);

CREATE INDEX IF NOT EXISTS trip_expenses_trip_id_location_id_idx
  ON public.trip_expenses (trip_id, location_id)
  WHERE location_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS trip_expenses_trip_id_activity_id_idx
  ON public.trip_expenses (trip_id, activity_id)
  WHERE activity_id IS NOT NULL;

COMMENT ON TABLE public.trip_expenses IS 'Trip spending lines; optional stop/activity scope';

ALTER TABLE public.trip_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trip_expenses_select_members"
  ON public.trip_expenses
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.trip_members tm
      WHERE tm.trip_id = trip_expenses.trip_id
        AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "trip_expenses_insert_members"
  ON public.trip_expenses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.trip_members tm
      WHERE tm.trip_id = trip_expenses.trip_id
        AND tm.user_id = auth.uid()
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
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.trip_members tm
      WHERE tm.trip_id = trip_expenses.trip_id
        AND tm.user_id = auth.uid()
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
    )
  );
