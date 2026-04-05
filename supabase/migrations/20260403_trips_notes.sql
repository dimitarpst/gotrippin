-- Trip-level notes (editable from trip overview; long-form, distinct from short description)
ALTER TABLE public.trips
ADD COLUMN IF NOT EXISTS notes text NULL;

COMMENT ON COLUMN public.trips.notes IS 'Freeform trip notes shown on overview; max length enforced in API';
