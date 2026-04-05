-- Per-trip user-uploaded gallery images (R2 keys + optional blurhash for placeholders)
CREATE TABLE IF NOT EXISTS public.trip_gallery_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips (id) ON DELETE CASCADE,
  storage_key text NOT NULL UNIQUE,
  blur_hash text NULL,
  width int NULL,
  height int NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_by uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS trip_gallery_images_trip_id_sort_idx
  ON public.trip_gallery_images (trip_id, sort_order ASC, created_at ASC);

COMMENT ON TABLE public.trip_gallery_images IS 'Trip member uploads; public URLs via R2 storage_key';

ALTER TABLE public.trip_gallery_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trip_gallery_images_select_members"
  ON public.trip_gallery_images
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.trip_members tm
      WHERE tm.trip_id = trip_gallery_images.trip_id
        AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "trip_gallery_images_insert_members"
  ON public.trip_gallery_images
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.trip_members tm
      WHERE tm.trip_id = trip_gallery_images.trip_id
        AND tm.user_id = auth.uid()
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
    )
  );
