-- Allow each user to read their own membership rows without relying on EXISTS(subquery on trip_members),
-- which is self-referential under RLS and breaks server-side checks (e.g. gallery presign with anon key + JWT).
-- Permissive policies are OR'd: this pairs with "Users can view members of their trips" for listing co-members.
CREATE POLICY "trip_members_select_own_row"
  ON public.trip_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());
